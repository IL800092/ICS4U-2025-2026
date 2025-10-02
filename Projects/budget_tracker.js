const prompt = require('prompt-sync')();
 
// Initialize budget and expenses array
let budget = parseFloat(prompt("Enter your budget: "));
let expenses = [];
 
// Function to add expense
function addExpense(amount, category) {
    expenses.push({ amount: parseFloat(amount), category: category });
    console.log(`Added expense: $${amount} for ${category}`);
}
 
// Function to calculate total expenses
function calculateTotal() {
    let total = 0;
    for (let i = 0; i < expenses.length; i++) {
        total += expenses[i].amount;
    }
    return total;
}
 
// Function to check budget
function checkBudget() {
    let total = calculateTotal();
    if (total > budget) {
        console.log(`You are over budget by $${(total - budget).toFixed(2)}!`);
    } else {
        console.log(`You are within budget. Remaining: $${(budget - total).toFixed(2)}`);
    }
}
 
// Function to remove expense by category
function removeExpense(category) {
    let index = expenses.findIndex(exp => exp.category.toLowerCase() === category.toLowerCase());
    if (index !== -1) {
        let removed = expenses.splice(index, 1);
        console.log(`Removed expense: $${removed[0].amount} for ${removed[0].category}`);
    } else {
        console.log(`No expense found for category: ${category}`);
    }
}
 
// Main program loop
let running = true;
while (running) {
    console.log("\nMenu:");
    console.log("1. Add an Expense");
    console.log("2. View Total Expenses");
    console.log("3. Check Budget");
    console.log("4. Remove an Expense");
    console.log("5. Exit");
 
    let choice = prompt("Choose an option (1-5): ");
 
    switch (choice) {
        case '1':
            let amount = prompt("Enter expense amount: ");
            let category = prompt("Enter expense category: ");
            addExpense(amount, category);
            break;
        case '2':
            console.log(`Total expenses: $${calculateTotal().toFixed(2)}`);
            break;
        case '3':
            checkBudget();
            break;
        case '4':
            let removeCat = prompt("Enter category to remove: ");
            removeExpense(removeCat);
            break;
        case '5':
            running = false;
            console.log("Exiting program. Goodbye!");
            break;
        default:
            console.log("Invalid choice. Please try again.");
    }
}
 