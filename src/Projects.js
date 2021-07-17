import ProjectCard from "./ProjectCard";
function Projects() {
  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "whitesmoke",
        borderTop: "1px solid #ccc",
      }}
    >
      <div class="container">
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Projects</h1>

        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
          <ProjectCard
            projectname="Simple Tic Tac Toe"
            projectdescription="A simple Tic Tac Toe App made using "
            projectlang="C#"
            projectdate="August 2019"
            projectimage="./TicTacToe.png"
          >
            <a
              href="https://github.com/iipacii/TicTacToe"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button type="button" class="btn btn-sm btn-outline-secondary">
                GitHub
              </button>
            </a>
          </ProjectCard>

          <ProjectCard
            projectname="Shakespeare Translator"
            projectdescription="Implementation of an API that translates plain english to something Shakespeare would write. Made using "
            projectlang="React JS"
            projectdate="July 2021"
            projectimage="./Translator.png"
          >
            <a
              href="https://github.com/iipacii/shakespeare"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button type="button" class="btn btn-sm btn-outline-secondary">
                GitHub
              </button>
            </a>
            <a
              href="https://iipacii.github.io/shakespeare"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button type="button" class="btn btn-sm btn-outline-secondary">
                Demo
              </button>
            </a>
          </ProjectCard>
        </div>
      </div>
    </div>
  );
}

export default Projects;
