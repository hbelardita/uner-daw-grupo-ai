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
