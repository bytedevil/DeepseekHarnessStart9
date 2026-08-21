"""
DeepSeek Harness Agent for StartOS

Main orchestration script for the DeepSeek Harness agent with StartOS integration.
Version: 0.4.0.1

This agent provides:
- Autonomous task execution using DeepSeek models
- StartOS service integration
- Automated workflows and task delegation
- Web search capabilities
- File operations
- Shell execution
"""

import os
import json
import time
import argparse
from typing import Dict, Any, Optional

# Carrega variables d'entorn des de .env si existeix
try:
    from dotenv import load_dotenv
    _ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(_ENV_PATH):
        load_dotenv(_ENV_PATH)
except ImportError:
    pass

# Imports (handle missing dependencies gracefully)
try:
    from google import genai
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False

try:
    from browser_use import BrowserUse
    BROWSER_USE_AVAILABLE = True
except ImportError:
    BROWSER_USE_AVAILABLE = False

# Global configuration
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "configs", "config.yaml")

# Load configuration
config = {}
if os.path.exists(CONFIG_PATH):
    import yaml
    with open(CONFIG_PATH, 'r') as f:
        config = yaml.safe_load(f)

class DeepSeekHarness:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_key = os.getenv(config.get('api', {}).get('api_key', 'GOOGLE_API_KEY'), '')
        
        # Initialize components
        self.setup_google_client()
        self.setup_browser_use()
        
        # StartOS integration
        self.startos = {
            'mode': config.get('startos', {}).get('mode', 'auto'),
            'max_concurrent_tasks': config.get('startos', {}).get('max_concurrent_tasks', 4),
            'timeout_seconds': config.get('startos', {}).get('timeout_seconds', 3600)
        }
        
    def setup_google_client(self):
        """Setup Google Generative AI client"""
        if GOOGLE_AVAILABLE and self.api_key:
            self.google_client = genai.Client(api_key=self.api_key)
        else:
            self.google_client = None
            
    def setup_browser_use(self):
        """Setup browser use for web automation"""
        if BROWSER_USE_AVAILABLE:
            self.browser_use = BrowserUse()
        else:
            self.browser_use = None
            
    def execute_with_deepseek(self, prompt: str, context: Optional[Dict] = None) -> str:
        """Execute a task using DeepSeek"""
        if not self.google_client:
            return "Error: Google Generative AI client not available. Please set GOOGLE_API_KEY."
            
        # Prepare the prompt with context if available
        full_prompt = prompt
        if context:
            full_prompt += f"\n\nContext: {json.dumps(context, indent=2)}"
            
        try:
            response = self.google_client.models.generate_content(
                model=self.config.get('api', {}).get('model', 'gemini-1.5-flash'),
                contents=full_prompt
            )
            return response.text
        except Exception as e:
            return f"Error executing with DeepSeek: {str(e)}"
            
    def web_search(self, query: str, num_results: int = 5) -> str:
        """Perform web search"""
        if not self.browser_use:
            return "Error: BrowserUse not available. Please install required dependencies."
            
        try:
            results = self.browser_use.search(query, num_results=num_results)
            return json.dumps(results, indent=2)
        except Exception as e:
            return f"Error performing web search: {str(e)}"
            
    def execute_workflow(self, workflow_config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a workflow configuration"""
        workflow_name = workflow_config.get('name', 'Unknown Workflow')
        steps = workflow_config.get('steps', [])
        
        results = {
            'workflow': workflow_name,
            'status': 'completed',
            'steps': [],
            'timestamp': time.time()
        }
        
        for i, step in enumerate(steps):
            step_name = step.get('name', f'Step {i+1}')
            prompt = step.get('prompt', '')
            
            try:
                step_result = self.execute_with_deepseek(prompt, step.get('context'))
                results['steps'].append({
                    'step': i+1,
                    'name': step_name,
                    'status': 'success',
                    'result': step_result,
                    'execution_time': time.time()
                })
            except Exception as e:
                results['status'] = 'failed'
                results['steps'].append({
                    'step': i+1,
                    'name': step_name,
                    'status': 'error',
                    'error': str(e),
                    'execution_time': time.time()
                })
                break
                
        return results
        
    def run(self, mode: str = 'auto', tasks: Optional[list] = None):
        """Run the agent"""
        if mode == 'auto':
            # Auto mode: wait for user input or run predefined tasks
            if tasks:
                return self.run_tasks(tasks)
            else:
                return self.interactive_mode()
        elif mode == 'test':
            return self.test_mode()
        else:
            return f"Unknown mode: {mode}"
            
    def run_tasks(self, tasks: list):
        """Run predefined tasks"""
        results = []
        for task in tasks:
            if isinstance(task, dict):
                result = self.execute_workflow(task)
            else:
                result = self.execute_with_deepseek(task)
            results.append(result)
        return results
        
    def test_mode(self):
        """Run tests"""
        test_results = {
            'config_loaded': bool(self.config),
            'google_available': GOOGLE_AVAILABLE,
            'browser_use_available': BROWSER_USE_AVAILABLE,
            'api_key_set': bool(self.api_key),
            'timestamp': time.time()
        }
        
        # Run basic test
        test_result = self.execute_with_deepseek("Say 'Hello World' and your name")
        test_results['test_execution'] = test_result
        
        return test_results
        
    def interactive_mode(self):
        """Run in interactive mode"""
        print("DeepSeek Harness Agent - Interactive Mode")
        print("Type 'exit' to quit, 'help' for commands")
        
        while True:
            try:
                user_input = input("\n> ")
                if user_input.lower() == 'exit':
                    break
                elif user_input.lower() == 'help':
                    self.show_help()
                else:
                    result = self.execute_with_deepseek(user_input)
                    print(result)
            except KeyboardInterrupt:
                print("\nInterrupted. Exiting...")
                break
                
        return {"status": "exited"}
        
    def show_help(self):
        """Show help information"""
        help_text = """
Commands:
  exit     - Exit interactive mode
  help     - Show this help
  <text>   - Send to DeepSeek

Configuration:
  - Set GOOGLE_API_KEY environment variable
  - Configure agents in configs/config.yaml

StartOS Integration:
  - Mode: auto (default), test
  - Max concurrent tasks: from config
  - Timeout: from config
"""
        print(help_text)

# Main execution
def main():
    parser = argparse.ArgumentParser(description='DeepSeek Harness Agent')
    parser.add_argument('--mode', choices=['auto', 'test'], default='auto',
                      help='Agent mode')
    parser.add_argument('--tasks', type=str, help='Path to tasks file (JSON)')
    
    args = parser.parse_args()
    
    # Initialize agent
    harness = DeepSeekHarness(config)
    
    # Load and run tasks if specified
    tasks = None
    if args.tasks and os.path.exists(args.tasks):
        with open(args.tasks, 'r') as f:
            tasks = json.load(f)
    
    # Run agent
    results = harness.run(mode=args.mode, tasks=tasks)
    
    # Save results
    with open('agent_results.json', 'w') as f:
        json.dump(results, f, indent=2)
        
    print("Agent execution completed. Results saved to agent_results.json")
    
    return results

if __name__ == "__main__":
    main()
