let person = {
    name : "steve",
    age : 24,
    isStudent : true
};

const age = 'age';
console.log(person.age);
console.log(person['age']);
console.log(person[age]);

for(let key in person){
    console.log(`${key} stores ${person[key]}`);
}