import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchiveRecordsPage } from './archive-records.page';

describe('ArchiveRecordsPage', () => {
  let component: ArchiveRecordsPage;
  let fixture: ComponentFixture<ArchiveRecordsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchiveRecordsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
