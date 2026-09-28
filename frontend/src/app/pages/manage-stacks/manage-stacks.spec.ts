import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageStacks } from './manage-stacks';

describe('ManageStacks', () => {
  let component: ManageStacks;
  let fixture: ComponentFixture<ManageStacks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageStacks],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageStacks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
