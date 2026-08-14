// UNER - TUDW - DAW - TP1
// Integrantes: Belardita, Horacio; Beron, Tomás; Garcia, Hugo; Ortega, Sergio; Sandoval, Edgardo.

// Consigna 1

interface Animal {
  nombre: string;
  gritar(): string;
}

// Consigna 2

class Perro implements Animal {
  private _nombre: string;

  constructor(nombre: string) {
    this._nombre = nombre;
  }

  get nombre(): string {
    return this._nombre;
  }

  public gritar(): string {
    return "guauuu";
  }
}

class Gato implements Animal {
  private _nombre: string;

  constructor(nombre: string) {
    this._nombre = nombre;
  }

  get nombre(): string {
    return this._nombre;
  }

  public gritar(): string {
    return "miauuu";
  }
}

class Vaca implements Animal {
  private _nombre: string;

  constructor(nombre: string) {
    this._nombre = nombre;
  }

  get nombre(): string {
    return this._nombre;
  }

  public gritar(): string {
    return "muuu";
  }
}

// Consigna 3

function describirAnimal(animal: Animal): void {
    console.log(`El animal ${animal.nombre} hace: ${animal.gritar()}`);
}

// Consigna 4

const perro: Animal = new Perro("Perro");
const gato: Animal = new Gato("Gato");
const vaca: Animal = new Vaca("Vaca");
console.log(vaca.nombre);
console.log(vaca.gritar());

// Consigna 5

describirAnimal(perro);
describirAnimal(gato);
describirAnimal(vaca);

// Consigna 6

enum DiasSemana {
  Lun = "Lunes",
  Mar = "Martes",
  Mie = "Miércoles",
  Jue = "Jueves",
  Vie = "Viernes",
  Sab = "Sábado",
  Dom = "Domingo"
}

console.log(DiasSemana.Lun);

// Consigna 7

let variable: string | number;
variable = "Messi";
console.log(variable);
variable = 10;
console.log(variable);


