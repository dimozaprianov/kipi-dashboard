import type { Component } from 'solid-js';
import {Route, Router} from "@solidjs/router";
import {Home} from "./pages/home";
import LayoutDefault from "./layouts/LayoutDefault";
import {Nightly} from "./pages/buildResults";
import {Weekly} from "./pages/buildResults";
import {BuildOnDemand} from "./pages/buildOnDemand";

const App: Component = () => {
  return (
      <Router>
        <Route component={LayoutDefault}>
          <Route path="/" component={Home} />
          <Route path="/nightly" component={Nightly} />
          <Route path="/weekly" component={Weekly} />
          <Route path="/builds" component={BuildOnDemand} />
        </Route>
      </Router>
  );
};

export default App;
