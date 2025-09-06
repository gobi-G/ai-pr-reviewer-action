// Test file with intentional issues for AI PR reviewer
import * as lodash from 'lodash'; // Heavy library import
import * as moment from 'moment'; // Another heavy library

const TestComponent = () => {
  // Security issue: eval usage
  const userInput = "console.log('test')";
  eval(userInput);

  // Performance issue: blocking operations
  const data = localStorage.getItem('userData');
  document.write('<div>Loading...</div>');

  // Accessibility issue: img without alt
  return `
    <div>
      <img src="test.jpg">
      <input type="text" placeholder="Enter name">
      <a href="http://example.com" target="_blank">Unsafe link</a>
      <div dangerouslySetInnerHTML={{ __html: userInput }}></div>
      <h1>Title</h1>
      <h3>Skipped h2</h3>
    </div>
  `;
};

export default TestComponent;
