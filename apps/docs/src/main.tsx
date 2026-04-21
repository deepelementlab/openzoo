import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DocsLayout } from "./components/docs-layout";
import { HomePage } from "./pages/home";
import { getDocTitle } from "./docs-nav";
import docContent from "./content";
import "@openzoo/ui/styles/globals.css";

function DocPage({ slug }: { slug: string }) {
  const Content = docContent[slug];
  if (!Content) {
    return (
      <div>
        <h1>Document Not Found</h1>
        <p>The document &quot;{slug}&quot; does not exist.</p>
        <a href="/docs/introduction">Go to Introduction</a>
      </div>
    );
  }

  return (
    <DocsLayout>
      <Content />
    </DocsLayout>
  );
}

function DocRoute() {
  const slug = window.location.pathname.split("/docs/")[1] || "introduction";

  React.useEffect(() => {
    const title = getDocTitle(slug);
    document.title = title ? `${title} — OpenZoo Docs` : "OpenZoo Docs";
  }, [slug]);

  return <DocPage slug={slug} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/docs/:slug" element={<DocRoute />} />
        <Route path="/docs" element={<DocPage slug="introduction" />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
