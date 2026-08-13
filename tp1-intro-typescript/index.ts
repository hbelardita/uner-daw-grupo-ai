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

// Consigna 6

enum DiasSemana {
  Lunes = "Lunes",
  Martes = "Martes",
  Miercoles = "Miercoles",
  Jueves = "Jueves",
  Viernes = "Viernes",
  Sabado = "Sabado",
  Domingo = "Domingo"
}

