/**
 * BaseAgent — Abstract base class for all SmartFlow agents.
 * Every agent accepts structured JSON input and returns structured JSON output.
 */
class BaseAgent {
  constructor(name) {
    if (new.target === BaseAgent) {
      throw new Error('BaseAgent is abstract and cannot be instantiated directly.');
    }
    this.name = name;
    this.lastRunTime = null;
    this.runCount = 0;
  }

  /**
   * Main entry point. Wraps process() with timing and error handling.
   * @param {Object} input - Structured JSON input
   * @returns {Object} - Structured JSON output
   */
  async run(input) {
    const start = Date.now();
    this.runCount++;
    try {
      const output = await this.process(input);
      this.lastRunTime = Date.now() - start;
      return {
        agent: this.name,
        timestamp: new Date().toISOString(),
        executionMs: this.lastRunTime,
        runCount: this.runCount,
        data: output
      };
    } catch (err) {
      this.lastRunTime = Date.now() - start;
      return {
        agent: this.name,
        timestamp: new Date().toISOString(),
        executionMs: this.lastRunTime,
        runCount: this.runCount,
        error: err.message,
        data: null
      };
    }
  }

  /**
   * Override this in subclasses.
   * @param {Object} input
   * @returns {Object}
   */
  async process(input) {
    throw new Error(`${this.name}.process() must be implemented.`);
  }
}

module.exports = BaseAgent;
