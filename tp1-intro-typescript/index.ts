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
  console.log(`El animal ${animal.nombre} hace ${animal.gritar()}`);
}

// Consigna 4

const perro: Perro = new Perro("Firulais");
const gato: Gato = new Gato("Apollo");
const vaca: Vaca = new Vaca("Lola");

// Consigna 6

enum DiasSemana {
  Lunes = "Lunes",
  Martes = "Martes",
  Miercoles = "Miercoles",
  Jueves = "Jueves",
  Viernes = "Viernes",
  Sabado = "Sabado",
  Domingo = "Domingo",
}

// Consigna 7
let valor: number | string;
valor = "Messi";
valor = 10;

// Consigna 8
interface Fila<T> {
  agregar(elemento: T): void;
  remover(): T | undefined;
}

class Cola<T> implements Fila<T> {
  private elementos: Array<T> = [];
  agregar(elemento: T): void {
    this.elementos.push(elemento);
  }
  remover(): T | undefined {
    return this.elementos.shift();
  }
}

// Consigna 9
const filaNumeros: Fila<number> = new Cola<number>();
const filaStrings: Fila<string> = new Cola<string>();
const filaAnimales: Fila<Animal> = new Cola<Animal>();
