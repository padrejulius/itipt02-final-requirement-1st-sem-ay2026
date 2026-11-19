import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FullyImmunizedPage } from './fully-immunized.page';

describe('FullyImmunizedPage', () => {
  let component: FullyImmunizedPage;
  let fixture: ComponentFixture<FullyImmunizedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FullyImmunizedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
