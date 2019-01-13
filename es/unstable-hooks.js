var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

/* eslint-disable jsx-a11y/anchor-has-content */
import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { pick, match, resolve } from "./lib/utils";
import { globalHistory } from "./lib/history";

// TODO: use scheduler
var rIC = window.requestIdleCallback || function (cb) {
  return Promise.resolve().then(cb);
};

////////////////////////////////////////////////////////////////////////////////
// Contexts
var HistoryContext = createContext(globalHistory);
var MatchContext = createContext({ route: { path: "" }, uri: "" });

////////////////////////////////////////////////////////////////////////////////
// helpers
var shouldNavigate = function shouldNavigate(event) {
  return !event.defaultPrevented && event.button === 0 && !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
};

var getBasePath = function getBasePath(path) {
  return path === "/" ? path : stripSlashes(path.replace(/\*$/, ""));
};

var createRoutes = function createRoutes(config, basepath) {
  return Object.keys(config).map(function (path) {
    var fullPath = path === "." ? basepath : stripSlashes(basepath) + "/" + stripSlashes(path);
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
  var history = useContext(HistoryContext);

  var _useState = useState(globalHistory.location),
      location = _useState[0],
      setLocation = _useState[1];

  useEffect(function () {
    return history.listen(function () {
      rIC(function () {
        return setLocation(history.location);
      });
    });
  }, [history]);

  useEffect(history._onTransitionComplete, [location]);

  return [location, history.navigate];
}

function useRouter(routeConfig, _default) {
  var _useLocation = useLocation(),
      location = _useLocation[0],
      navigate = _useLocation[1];

  var base = useContext(MatchContext);
  var basepath = getBasePath(base.route.path);

  var routes = useMemo(function () {
    return createRoutes(routeConfig, basepath);
  }, [routeConfig, basepath]);

  var match = useMemo(function () {
    return pick(routes, location.pathname);
  }, [location.pathname, routes]);

  if (match) {
    var params = match.params,
        uri = match.uri,
        route = match.route;

    var element = route.handler(_extends({}, params, { uri: uri, navigate: navigate, location: location }));
    return React.createElement(MatchContext.Provider, { value: match, children: element });
  } else {
    return _default && _default() || "Not Found";
  }
}

function useMatch(path) {
  var _useLocation2 = useLocation(),
      location = _useLocation2[0],
      navigate = _useLocation2[1];

  var result = match(path, location.pathname);
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

  var base = useContext(MatchContext);
  var href = resolve(to, base.uri);
  var isCurrent = location.pathname === href;

  return React.createElement("a", _extends({
    "aria-current": isCurrent ? "page" : undefined
  }, anchorProps, {
    href: href,
    onClick: function onClick(event) {
      if (anchorProps.onClick) anchorProps.onClick(event);
      if (shouldNavigate(event)) {
        event.preventDefault();
        navigate(href, { state: state, replace: replace });
      }
    }
  }));
}

export { useRouter, useLocation, useMatch, Link };