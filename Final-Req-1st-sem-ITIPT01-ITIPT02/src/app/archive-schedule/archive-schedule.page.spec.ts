import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchiveSchedulePage } from './archive-schedule.page';

describe('ArchiveSchedulePage', () => {
  let component: ArchiveSchedulePage;
  let fixture: ComponentFixture<ArchiveSchedulePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchiveSchedulePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
