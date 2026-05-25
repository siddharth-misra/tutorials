const tutorials = [
  {
    key: "system-design",
    label: "System Design",
    hrefFromRoot: "system-design/systemdesign.html",
  },
  {
    key: "agentic-ai",
    label: "Agentic AI",
    hrefFromRoot: "agentic-system/agentic-ai.html",
  },
  {
    key: "aws",
    label: "AWS",
    hrefFromRoot: "aws/aws.html",
  },
  {
    key: "dsa",
    label: "DSA",
    hrefFromRoot: "dsa/dsa.html",
  },
  {
    key: "coding-patterns",
    label: "Coding Patterns",
    hrefFromRoot: "coding-patterns/coding-patterns.html",
  },
  {
    key: "dsa-coding-design",
    label: "Java DSA + Patterns",
    hrefFromRoot: "dsa-coding-design-patterns/dsa-coding-design.html",
  },
  {
    key: "visa-payments",
    label: "Visa & Payments",
    hrefFromRoot: "payment-systems/visa-payments.html",
    showInNav: false,
  },
];

const publicTutorials = tutorials.filter((tutorial) => tutorial.showInNav !== false);

module.exports = { tutorials, publicTutorials };
