import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedingListPage } from './feeding-list.page';

describe('FeedingListPage', () => {
  let component: FeedingListPage;
  let fixture: ComponentFixture<FeedingListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedingListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
