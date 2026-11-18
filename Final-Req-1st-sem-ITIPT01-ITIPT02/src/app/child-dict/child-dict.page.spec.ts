import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChildDictPage } from './child-dict.page';

describe('ChildDictPage', () => {
  let component: ChildDictPage;
  let fixture: ComponentFixture<ChildDictPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildDictPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
