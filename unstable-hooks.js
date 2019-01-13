"use strict";

exports.__esModule = true;
exports.Link = exports.useMatch = exports.useLocation = exports.useRouter = undefined;

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }; /* eslint-disable jsx-a11y/anchor-has-content */

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _utils = require("./lib/utils");

var _history = require("./lib/history");

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _objectWithoutProperties(obj, keys) {
  var target = {};
  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }
  return target;
}

// TODO: use scheduler
var rIC =
  window.requestIdleCallback ||
  function(cb) {
    return Promise.resolve().then(cb);
  };

////////////////////////////////////////////////////////////////////////////////
// Contexts
var HistoryContext = (0, _react.createContext)(_history.globalHistory);
var MatchContext = (0, _react.createContext)({ route: { path: "" }, uri: "" });

////////////////////////////////////////////////////////////////////////////////
// helpers
var shouldNavigate = function shouldNavigate(event) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
  );
};

var getBasePath = function getBasePath(path) {
  return path === "/" ? path : stripSlashes(path.replace(/\*$/, ""));
};

var createRoutes = function createRoutes(config, basepath) {
  return Object.keys(config).map(function(path) {
    var fullPath =
      path === "."
        ? basepath
        : stripSlashes(basepath) + "/" + stripSlashes(path);
    return {
      path: fullPath,
      handler: config[path]
    };
  });
};

var stripSlashes = function stripSlashes(str) {
  return str.replace(/(^\/+|\/+$)/g, "");
};

////////////////////////////////////////////////////////////////////////////////
// hooks
function useLocation() {
  var history = (0, _react.useContext)(HistoryContext);

  var _useState = (0, _react.useState)(_history.globalHistory.location),
    location = _useState[0],
    setLocation = _useState[1];

  (0, _react.useEffect)(
    function() {
      return history.listen(function() {
        rIC(function() {
          return setLocation(history.location);
        });
      });
    },
    [history]
  );

  (0, _react.useEffect)(history._onTransitionComplete, [location]);

  return [location, history.navigate];
}

function useRouter(routeConfig, _default) {
  var _useLocation = useLocation(),
    location = _useLocation[0],
    navigate = _useLocation[1];

  var base = (0, _react.useContext)(MatchContext);
  var basepath = getBasePath(base.route.path);

  var routes = (0, _react.useMemo)(
    function() {
      return createRoutes(routeConfig, basepath);
    },
    [routeConfig, basepath]
  );

  var match = (0, _react.useMemo)(
    function() {
      return (0, _utils.pick)(routes, location.pathname);
    },
    [location.pathname, routes]
  );

  if (match) {
    var params = match.params,
      uri = match.uri,
      route = match.route;

    var element = route.handler(
      _extends({}, params, { uri: uri, navigate: navigate, location: location })
    );
    return _react2.default.createElement(MatchContext.Provider, {
      value: match,
      children: element
    });
  } else {
    return (_default && _default()) || "Not Found";
  }
}

function useMatch(path) {
  var _useLocation2 = useLocation(),
    location = _useLocation2[0],
    navigate = _useLocation2[1];

  var result = (0, _utils.match)(path, location.pathname);
  return _extends({ navigate: navigate }, result);
}

////////////////////////////////////////////////////////////////////////////////
// Components
function Link(_ref) {
  var to = _ref.to,
    state = _ref.state,
    _ref$replace = _ref.replace,
    replace = _ref$replace === undefined ? false : _ref$replace,
    anchorProps = _objectWithoutProperties(_ref, ["to", "state", "replace"]);

  var _useLocation3 = useLocation(),
    location = _useLocation3[0],
    navigate = _useLocation3[1];

  var base = (0, _react.useContext)(MatchContext);
  var href = (0, _utils.resolve)(to, base.uri);
  var isCurrent = location.pathname === href;

  return _react2.default.createElement(
    "a",
    _extends(
      {
        "aria-current": isCurrent ? "page" : undefined
      },
      anchorProps,
      {
        href: href,
        onClick: function onClick(event) {
          if (anchorProps.onClick) anchorProps.onClick(event);
          if (shouldNavigate(event)) {
            event.preventDefault();
            navigate(href, { state: state, replace: replace });
          }
        }
      }
    )
  );
}

exports.useRouter = useRouter;
exports.useLocation = useLocation;
exports.useMatch = useMatch;
exports.Link = Link;
