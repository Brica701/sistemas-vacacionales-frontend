import { TestBed } from '@angular/core/testing';

import { Vacaciones } from './vacaciones';

describe('Vacaciones', () => {
  let service: Vacaciones;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Vacaciones);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
