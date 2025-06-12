export default function CodeRunnerPluginConfig() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Code Runner Plugin Configuration</h2>
      <p>
        This plugin allows you to run code snippets and evaluate their output as part of
        the rubric criteria. Configure the plugin settings below.
      </p>
      {/* Add configuration options here */}
      <div className="mt-4">
        <label className="block mb-2">Plugin Settings</label>
        <input
          type="text"
          placeholder="Enter plugin settings"
          className="border rounded-md p-2 w-full"
        />
      </div>
    </div>
  );
}
