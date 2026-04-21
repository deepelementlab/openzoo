function Contributing() {
  return (
    <>
      <h1>Contributing</h1>
      <p>We welcome contributions to OpenZoo! Here's how to get started.</p>

      <h2>Development Setup</h2>
      <pre><code>git clone https://github.com/openzoo/openzoo.git
cd openzoo

go work init ./server
pnpm install</code></pre>

      <h2>Project Structure Conventions</h2>
      <ul>
        <li>Backend code follows Go standard layout: <code>cmd/</code>, <code>internal/</code>, <code>pkg/</code></li>
        <li>Frontend code follows the three-package pattern: <code>core</code>, <code>ui</code>, <code>views</code></li>
        <li>All API changes must start with a Protobuf definition update</li>
        <li>Use conventional commits: <code>feat:</code>, <code>fix:</code>, <code>docs:</code>, <code>refactor:</code></li>
      </ul>

      <h2>Code Style</h2>
      <h3>Go</h3>
      <ul>
        <li>Run <code>gofmt</code> before committing</li>
        <li>Follow effective Go guidelines</li>
        <li>Add tests for new functionality</li>
      </ul>

      <h3>TypeScript/React</h3>
      <ul>
        <li>Run <code>pnpm typecheck</code> and <code>pnpm lint</code></li>
        <li>Use functional components with hooks</li>
        <li>Follow existing naming conventions</li>
        <li>No comments in code unless explicitly requested</li>
      </ul>

      <h2>Pull Request Process</h2>
      <ol>
        <li>Fork the repository</li>
        <li>Create a feature branch: <code>git checkout -b feat/my-feature</code></li>
        <li>Make changes and add tests</li>
        <li>Ensure all checks pass: <code>pnpm build && pnpm test && pnpm typecheck</code></li>
        <li>Submit a pull request with a clear description</li>
      </ol>

      <h2>Reporting Issues</h2>
      <p>Use GitHub Issues with the appropriate template (bug report, feature request, question).</p>
    </>
  );
}

export default Contributing;
