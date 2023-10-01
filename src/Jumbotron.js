const Jumbotron = () => {
  return (
    <section
      className="text-center container"
      style={{
        paddingTop: "3rem ",
        backgroundImage: `url(./Background.gif)`,
        backgroundRepeat: "repeat",
        backgroundSize: "100%",
        backgroundPosition: "center",
        paddingBottom: "0px !important",
      }}
    >
      <div className="row py-lg-5" style={{ paddingTop: "50px" }}>
        <div className="col-lg-6 col-md-8 mx-auto">
          <img
            src="./Profile.jpg"
            alt="Profile"
            width="370"
            height="370"
            className="rounded-circle"
          />
          <h1 className="fw-light" style={{ backdropFilter: "blur(10px)" }}>
            Pranshu Acharya
          </h1>
          <p
            className="lead text-muted"
            style={{ backdropFilter: "blur(10px)" }}
          >
            Data Scientist with a former experience as a developer. Background
            in Mathematics and programming with a deep interest in Data
            Analytics and Natural Language Processing. Someone who can adapt to
            new technologies and languages quickly.
          </p>
          <p>
            <a
              href="/resume.pdf"
              className="btn btn-dark my-2"
              style={{ margin: "4px" }}
            >
              Resume
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Jumbotron;
