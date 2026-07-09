// Fetches Spotify + Letterboxd stats, merges manually-curated books/games from
// data/manual.json, and writes data/stats.json for the static site.
//
// Sections that fail to fetch fall back to the values already in data/stats.json,
// so a flaky run never wipes good data. Exits non-zero only if a section fails
// and there is nothing to fall back to.
//
// Env vars: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN,
//           LETTERBOXD_USERNAME, TMDB_API_KEY (optional), RAWG_API_KEY (optional)

const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const DATA_DIR = path.join(__dirname, '..', 'data');
const STATS_PATH = path.join(DATA_DIR, 'stats.json');
const MANUAL_PATH = path.join(DATA_DIR, 'manual.json');

// --- ENRICHMENT HELPERS ---

// 1. Book Cover Lookup (Open Library - Free, No Key)
const getBookDetails = async (title, author) => {
    try {
        const query = encodeURIComponent(`title:${title} author:${author}`);
        const res = await axios.get(`https://openlibrary.org/search.json?q=${query}&limit=1`);
        if (res.data.docs.length > 0) {
            const book = res.data.docs[0];
            return {
                cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null,
                link: `https://openlibrary.org${book.key}`
            };
        }
    } catch (e) { console.error(`Book lookup failed for ${title}:`, e.message); }
    return { cover: null, link: null };
};

// 2. Game Art Lookup (RAWG - Requires Free Key)
const getGameDetails = async (name) => {
    try {
        if (!process.env.RAWG_API_KEY) return { cover: null };
        const res = await axios.get(`https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(name)}&page_size=1`);
        if (res.data.results.length > 0) {
            return { cover: res.data.results[0].background_image };
        }
    } catch (e) { console.error(`Game lookup failed for ${name}:`, e.message); }
    return { cover: null };
};

// --- MEDIA HELPERS ---

const fetchSpotify = async () => {
    const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', process.env.SPOTIFY_REFRESH_TOKEN.trim());

    const tokenRes = await axios.post('https://accounts.spotify.com/api/token', params, {
        headers: { 'Authorization': `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const token = tokenRes.data.access_token;
    const [tracksRes, artistsRes] = await Promise.all([
        axios.get('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=10', { headers: { Authorization: `Bearer ${token}` } })
    ]);

    return {
        tracks: tracksRes.data.items.map(t => ({ name: t.name, artist: t.artists[0].name, img: t.album.images[0].url, url: t.external_urls.spotify })),
        artists: artistsRes.data.items.map(a => ({ name: a.name, img: a.images[0].url, url: a.external_urls.spotify }))
    };
};

const fetchLetterboxd = async () => {
    const username = process.env.LETTERBOXD_USERNAME;
    const BASE_URL = 'https://letterboxd.com';

    const profilePage = await axios.get(`${BASE_URL}/${username}/`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(profilePage.data);
    const topFour = [];

    $('.favourite-production-poster-container').each((i, el) => {
        // 1. Get the Link from the data-target-link or the <a> tag
        const container = $(el).find('.react-component');
        let relativeLink = container.attr('data-target-link') || $(el).find('a').attr('href');

        // Clean up the link to avoid "undefined"
        const link = relativeLink ? `${BASE_URL}${relativeLink}` : null;

        // 2. Get the Poster
        const img = $(el).find('img');
        let poster = '';

        // Priority: srcset (high res) -> src (standard) -> data-poster-url (backup)
        const srcset = img.attr('srcset');
        if (srcset) {
            const parts = srcset.split(',');
            poster = parts[parts.length - 1].trim().split(' ')[0];
        } else {
            poster = img.attr('src') || container.attr('data-poster-url');
        }

        // If it's still a relative path, prepend the Letterboxd domain
        if (poster && poster.startsWith('/')) {
            poster = `https://a.ltrbxd.com${poster}`;
        }

        topFour.push({
            title: img.attr('alt') ? img.attr('alt').replace('Poster for ', '') : 'Unknown Film',
            poster: poster,
            link: link
        });
    });

    // Activity Section (First 12)
    const feed = await parser.parseURL(`${BASE_URL}/${username}/rss/`);
    const activity = feed.items.slice(0, 12).map(item => {
        const starRegex = /(★{1,5}½?)|(½)/;
        const rating = (item.title.match(starRegex) || ['No rating'])[0];

        const imgRegex = /src="([^"]+)"/;
        const match = item.content.match(imgRegex);
        const posterUrl = match ? match[1] : null;

        return {
            title: item.title.split(',')[0].replace(starRegex, '').trim(),
            rating,
            poster: posterUrl,
            link: item.link,
            watchedDate: item.pubDate
        };
    });

    return { topFour, activity };
};

const getMoviePoster = async (title) => {
    try {
        if (!process.env.TMDB_API_KEY) return null;
        const res = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
        if (res.data.results.length > 0 && res.data.results[0].poster_path) {
            return `https://image.tmdb.org/t/p/w500${res.data.results[0].poster_path}`;
        }
    } catch (e) { console.error(`TMDB lookup failed for ${title}:`, e.message); }
    return null;
};

// --- MAIN ---

const main = async () => {
    let previous = null;
    try { previous = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8')); } catch { /* first run */ }

    const manual = JSON.parse(fs.readFileSync(MANUAL_PATH, 'utf8'));

    // 1. Spotify (fall back to previous run on failure)
    let spotify = previous?.spotify || null;
    try {
        spotify = await fetchSpotify();
        console.log(`Spotify: ${spotify.tracks.length} tracks, ${spotify.artists.length} artists`);
    } catch (e) {
        console.error('Spotify fetch failed, keeping previous data:', e.message);
    }

    // 2. Letterboxd (fall back per sub-section: a bot-detection page can return
    //    200 with nothing to scrape, so empty results also count as a failure)
    let letterboxd = previous?.letterboxd || null;
    try {
        const fresh = await fetchLetterboxd();
        letterboxd = {
            topFour: fresh.topFour.length ? fresh.topFour : (letterboxd?.topFour || []),
            activity: fresh.activity.length ? fresh.activity : (letterboxd?.activity || [])
        };
        console.log(`Letterboxd: ${fresh.topFour.length} favourites, ${fresh.activity.length} diary entries`);
    } catch (e) {
        console.error('Letterboxd fetch failed, keeping previous data:', e.message);
    }

    // 3. Self-healing: the profile scrape returns lazy-load placeholders for the
    //    top four, so reuse the previous run's healed poster, then fall back to TMDB
    if (letterboxd?.topFour) {
        for (const movie of letterboxd.topFour) {
            if (!movie.poster || movie.poster.includes('empty-poster')) {
                const prev = previous?.letterboxd?.topFour?.find(m => m.title === movie.title);
                if (prev?.poster && !prev.poster.includes('empty-poster')) {
                    movie.poster = prev.poster;
                    continue;
                }
                console.log(`Healing broken poster for: ${movie.title}`);
                const fixedPoster = await getMoviePoster(movie.title);
                if (fixedPoster) movie.poster = fixedPoster;
            }
        }
    }

    // 4. Books: manual list; fill missing covers from previous run, then Open Library
    const books = [];
    for (const entry of manual.books) {
        const book = { ...entry };
        if (!book.cover) {
            const prev = previous?.books?.find(b => b.title === book.title);
            if (prev?.cover) {
                book.cover = prev.cover;
                book.link = book.link || prev.link;
            } else {
                console.log(`Fetching cover for book: ${book.title}`);
                const details = await getBookDetails(book.title, book.author);
                if (details.cover) {
                    book.cover = details.cover;
                    book.link = book.link || details.link;
                }
            }
        }
        books.push(book);
    }

    // 5. Games: manual list; fill missing covers from previous run, then RAWG
    const games = [];
    for (const entry of manual.games) {
        const game = { ...entry };
        if (!game.cover) {
            const prev = previous?.games?.find(g => g.name === game.name);
            if (prev?.cover) {
                game.cover = prev.cover;
            } else {
                console.log(`Fetching art for game: ${game.name}`);
                const details = await getGameDetails(game.name);
                if (details.cover) game.cover = details.cover;
            }
        }
        games.push(game);
    }

    if (!spotify) throw new Error('No Spotify data and no previous stats.json to fall back to.');
    if (!letterboxd) throw new Error('No Letterboxd data and no previous stats.json to fall back to.');

    const result = { spotify, letterboxd, books, games };

    // Skip the write (and therefore the commit) when nothing actually changed
    if (previous) {
        const { generatedAt, ...prevData } = previous;
        if (JSON.stringify(prevData) === JSON.stringify(result)) {
            console.log('No changes since last run; leaving stats.json untouched.');
            return;
        }
    }

    fs.writeFileSync(STATS_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), ...result }, null, 2) + '\n');
    console.log(`Wrote ${STATS_PATH}`);
};

main().catch(err => {
    console.error('fetch-stats failed:', err.message);
    process.exit(1);
});
