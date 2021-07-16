import "./CustomCSS.css";

const HeaderBar = () => {
  return (
    <div>
      <nav className="navbar fixed-top navbar-light bg-dark">
        <div
          className="container"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <a href="/">
            <img
              src="./Animatedlogo.gif"
              alt="logo"
              width="70"
              height="70"
              className="rounded-circle"
            />
          </a>
        </div>
      </nav>

      <div className="container"></div>
      {/* <nav
        style={{
          textAlignLast: "center",
          margin: "0 auto",
          border: "1px solid #ccc",
          borderWidth: "1px 0",
          paddingTop: "75px",
          height: "150px",
        }}
      >
        <ul className="nav justify-content-center">
          <li>
            <a className="nav a" href="/">
              Projects
            </a>
          </li>
          <li>
            <a className="nav a" href="/about/">
              Contacts
            </a>
          </li>
        </ul>
      </nav> */}
    </div>
  );
};

export default HeaderBar;
