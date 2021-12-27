import { TestBed } from '@angular/core/testing';

import { InterceptService } from './intercept.service';

describe('InterceptService', () => {
  let service: InterceptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterceptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
