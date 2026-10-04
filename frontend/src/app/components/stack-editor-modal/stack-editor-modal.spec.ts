import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StackEditorModal } from './stack-editor-modal';

describe('StackEditorModal', () => {
  let component: StackEditorModal;
  let fixture: ComponentFixture<StackEditorModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackEditorModal],
    }).compileComponents();

    fixture = TestBed.createComponent(StackEditorModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
