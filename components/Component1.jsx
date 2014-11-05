// Good old React Component!

var React = require("react");
var PropTypes = React.PropTypes;
var Link = require("react-router").Link;
var BSCol = require("react-bootstrap/Col");
var routeData = require("dynamic-metadata").routes;
var BSButton = require("react-bootstrap/Button");
var actions = require("actions");

// Use this to provide localization strings.
var __ = require("language").__;

var PlaceHolder = React.createClass({

  propTypes : {
    displayName : PropTypes.string
  },

  test: false,

  executeMyRequest: function() {
    var value = this.test ? "test" : "testValid";
    this.test = !this.test;

    actions.example.get1({
      data: {
        id:14,
        value: value
      }
    }, function(err, res) {
      if(err) {
        alert("Error");
        return console.log(err);
      }

      alert("Success");
      console.log(res.body);
    });
  },

  render: function() {
    var name = this.props.displayName || this.props.name || "Empty";
    return (
      <BSCol md={12}>
        <h1>
          {name}
        </h1>
        This is a placeholder with no interesting content what so ever
        <Link to={routeData.public.name}>Go to homepage.</Link>
        <BSButton onClick={this.executeMyRequest}>Test Request</BSButton>
        {/* Translation string usage. */}
        <p>{__("newkey")}</p>
        <p>{__("general::newkey")}</p>{/* <-- Same as the line above. */}
        <p>{__("mynamespace::somekey")}</p>
      </BSCol>
    );
  }
});

module.exports = PlaceHolder;
