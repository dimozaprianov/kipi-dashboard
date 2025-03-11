import type { Component } from 'solid-js';
import {Route, Router} from "@solidjs/router";
import {Home} from "./pages/home";
import LayoutDefault from "./layouts/LayoutDefault";
import {Nightly} from "./pages/nightlyResults";
import {Weekly} from "./pages/weeklyResults";
import {Builds} from "./pages/builds";

const App: Component = () => {
  return (
      <Router>
        <Route component={LayoutDefault}>
          <Route path="/" component={Home} />
          <Route path="/nightly" component={Nightly} />
          <Route path="/weekly" component={Weekly} />
          <Route path="/builds" component={Builds} />
        </Route>
      </Router>
  );
};

export default App;
