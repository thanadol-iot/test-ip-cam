class Animal {
    speak() {
        console.log("This animal makes a sound.");
    }
}

class Dog extends Animal {
    speak() {
        console.log("The dog barks.");
    }
}

class Cat extends Animal {
    speak() {
        console.log("The cat meows.");
    }
}

function makeAnimalSpeak(animal) {
    animal.speak();
}

const myDog = new Dog();
const myCat = new Cat();

// ใช้ฟังก์ชันเดียวกัน แต่พฤติกรรมเปลี่ยนไปตามประเภทของวัตถุ
makeAnimalSpeak(myDog); // Output: The dog barks.
makeAnimalSpeak(myCat); // Output: The cat meows.
// makeAnimalSpeak(aaa);