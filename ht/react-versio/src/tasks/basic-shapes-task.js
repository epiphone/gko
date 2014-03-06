/** @jsx React.DOM */
/* global React, d3, TaskUtils */
"use strict";

/**
 * Click the appropriate shape in a coordinate system.
 */
var BasicShapesTask = React.createClass({

  propTypes: {
    onTaskDone: React.PropTypes.func.isRequired
  },

  startGame: function() {
    this.setState({isRunning: true, score: 0});
    this.reset();
  },

  /**
   * Returns an array of six different shapes that fill the coords
   * in a random order.
   */
  getRandomShapes: function() {
    var c1 = 0.46, c2 = 1.21, s1 = 1.43, s2 = 0.885;
    var pentagonPts = [[-s2,-c2], [-s1,c1], [0,1.5], [s1,c1], [s2,-c2]];
    pentagonPts = TaskUtils.translate(pentagonPts, 2.5, 1.5);

    var translates = [[0,0], [6,0], [0,4], [6,4], [0,8], [6,8]];
    var bases = [
      {name:"kolmio", points:[[1,0], [1,3], [4,0]]},
      {name:"neliö", points:[[1,0], [1,3], [4,3], [4,0]]},
      {name:"ympyrä", points:[[2.5,1.5]], r:1.5},
      {name:"suunnikas", points:[[0,0], [0.5,3], [4.5,3], [4,0]]},
      {name:"puolisuunnikas", points:[[0,0], [0.5,3], [4,3], [4.5,0]]},
      {name:"viisikulmio", points:pentagonPts}
    ];

    bases = TaskUtils.shuffle(bases);
    var clrs = d3.scale.category10();

    var shapes = bases.map(function(base, i) {
      var translateX = translates[i][0] + Math.random();
      var translateY = translates[i][1] + Math.random();
      base.points = TaskUtils.translate(base.points, translateX, translateY);
      base.key = i;
      base.onClick = this.handleShapeClick;
      base.stroke = "black";
      base.fill = clrs(TaskUtils.rand(9));
      return base;
    }.bind(this));

    return shapes;
  },

  /** Reset the question, i.e. generate new shapes. */
  reset: function() {
    var shapes = this.getRandomShapes();

    // Prevent asking for the same shape twice in a row.
    var possibleTargets = shapes;
    if (this.state.target) {
      possibleTargets = possibleTargets.filter(function(shape) {
        return shape.name !== this.state.target.name;
      }.bind(this));
    }
    var target = possibleTargets[TaskUtils.rand(possibleTargets.length)];

    this.setState({
      shapes: this.getRandomShapes(),
      target: target
    });
  },

  /** Check if correct shape and proceed. */
  handleShapeClick: function(shape) {
    var scoreIncrement;
    if (shape.name === this.state.target.name) {
      scoreIncrement = 1;
    } else {
      scoreIncrement = -1;
    }

    this.setState({score: Math.max(this.state.score + scoreIncrement, 0)});
    this.reset();
  },

  handleTaskDone: function() {
    this.props.onTaskDone();
  },

  getInitialState: function() {
    return {
      shapes: [],
      score: 0,
      isRunning: false,
      isFinished: false
    };
  },

  render: function() {
    /* jshint ignore:start */
    var shapes = this.state.shapes;
    var taskIsDone = this.state.step > parseInt(this.props.steps);
    var coords, sidebar;

    if (!this.state.isFinished) {
      var bounds = {maxY: 12, maxX: 12, minY: 0, minX: 0};

      coords = <Coords drawAxes={false} shapes={shapes} bounds={bounds} aspect={1} />;

      var shapeToFind = "kolmio";

      var startBtn = this.state.isRunning ? null : (
        <div>
          <hr/>
          <button className="animated animated-repeat bounce btn btn-primary btn-block" onClick={this.startGame}>
            Aloita peli
          </button>
        </div>
      );

      var targetDisplay = !this.state.target ? null : (
        <div className="animated bounce-in">
          <hr/>
          Klikattava kappale: <strong>{this.state.target.name}</strong>
          <hr/>
          Pisteet: {this.state.score}
        </div>
      );

      sidebar = (
        <div>
          <TaskPanel header="Ohjeet">
            Etsi koordinaatistosta <strong>{shapeToFind}</strong> ja klikkaa sitä
            {startBtn}
            {targetDisplay}
          </TaskPanel>
        </div>
      );
    }
    else if (taskIsDone) {
      coords = <TaskDoneDisplay score={10}/>;
    }

    return (
      <div className="task-container">
        <TaskHeader name="Kappaleiden tunnistaminen" step={this.state.step} steps={this.props.steps} />
        <div className="row">
          <div className="col-sm-6 question">
            {coords}
          </div>

          <div className="col-sm-5 col-sm-offset-1">
            {sidebar}
          </div>
        </div>
      </div>
    );
    /* jshint ignore:end */
  }
});
