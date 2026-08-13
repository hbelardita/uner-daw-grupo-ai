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


// Consigna 4

const perro: Perro = new Perro("Firulais");
const gato: Gato = new Gato("Apollo");
const vaca: Vaca = new Vaca("Lola");


// Consigna 7
let valor: number | string;
valor = "Messi";
valor = 10;