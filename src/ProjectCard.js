const ProjectCard = (props) => {
  return (
    <div class="col">
      <div class="card shadow-sm">
        {/* <img
          src={props.projectimage}
          className="img-fluid"
          alt="Responsive "
          style={{ height: "100%", width: "100%" }}
        ></img> */}
        <div
          style={{
            backgroundImage: `url(${props.projectimage})`,
            filter: " blur(2px)",
            height: "200px",
          }}
        ></div>
        <h1 className="display-6" style={{ textAlign: "center" }}>
          {props.projectname}
        </h1>

        <div class="card-body">
          <p class="card-text">
            {props.projectdescription}
            <b>{props.projectlang}</b>
          </p>
          <div class="d-flex justify-content-between align-items-center">
            <div class="btn-group">{props.children}</div>
            <small class="text-muted">{props.projectdate}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
