import PromptSync from "prompt-sync"; //import the prompt command
import books from "./books.js"; // import deslauriers array of books
const prompt = PromptSync(); //the word prompt is command to prompt users

const library = books; 

function addBook(library, title, author, year) {
  const book = {
    title: String(title), // keys
    author: String(author),
    year: Number(year),
    isAvailable: true
  };
  library.push(book); // adds to library
  return book;
}

function listAvailableBooks(library) {
  for (let i = 0; i < library.length; i++) {
    const book = library[i];
    if (book.isAvailable === true) { // checks for type and value
      console.log(book.title);
    }
  }
}

function borrowBook(library, title) {
  for (let i = 0; i < library.length; i++) {
    const book = library[i];
    if (book.title === title) {
      if (book.isAvailable) {
        book.isAvailable = false;
        console.log(`Borrowed: ${book.title}`); //like f string in python (template literal)
        return true;
      } else {
        console.log("That book is already borrowed.");
        return false;
      }
    }
  }
  console.log("Book not found.");
  return false;
}


function returnBook(library, title) {
  const t = String(title);

  for (let i = 0; i < library.length; i++) {
    const book = library[i];

    if (book.title === t) {
      if (book.isAvailable === false) {
        book.isAvailable = true;
        console.log(`Returned: ${book.title}`);
        return true;
      } else {
        console.log("That book wasn’t borrowed.");
        return false;
      }
    }
  }
  console.log("Book not found.");
  return false;
}

function listBooksByAuthor(library, author) {
  const a = String(author);

  console.log(`Books by ${a}:`);
  for (let i = 0; i < library.length; i++) {
    const book = library[i];
    if (book.author === a) {
      console.log(book.title);
    }
  }
}

function listBooksBeforeYear(library, year) {
  const y = Number(year);

  console.log(`Books published before ${y}:`);
  for (let i = 0; i < library.length; i++) {
    const book = library[i];
    if (book.year < y) {
      console.log(book.title); 
    }
  }
}

function removeBook(library, title){
    const t = String(title);
    let found = false;
    for(let i = 0; i < library.length;i++) {
        const book = library[i];
        if(book.title === t){
            books.splice(i,1) // removes that index
            console.log("Book found");
            found = true;
            break;
        }
    }
    if(!found){
      console.log("book not found");
    }
}





function showMenu() {
  console.log(`
Library Menu
1) Add a book
2) List available books
3) Borrow a book
4) Return a book
5) List books by author
6) List books before a year
7) Remove a book
0) Exit
`);
}

while (true) { //running sequence
  showMenu();
  const choice = Number(prompt("Choose an option: "));

    if (choice === 0) {
      console.log("Goodbye!");
      break;
    }

    else if (choice === 1){
      const title = prompt("Title: ");
      const author = prompt("Author: ");
      const year = prompt("Year: ");
      addBook(library, title, author, year);
    }
    else if (choice === 2){
      listAvailableBooks(library);

    }
    else if (choice === 3){
      const title = prompt("Title to borrow: ");
      borrowBook(library, title);

    }
    else if (choice === 4){
      const title = prompt("Title to return: ");
      returnBook(library, title);

    }
    else if (choice === 5){
      const author = prompt("Author name: ");
      listBooksByAuthor(library, author);

    }
    else if (choice === 6){
      const year = prompt("Enter year: ");
      listBooksBeforeYear(library, year);

    }
    else if (choice === 7){
      const title = prompt("Title to remove: ");
      removeBook(library, title);

    }
    else{
        console.log("Invalid choice.");
    }
  }
