import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardEditorModal } from './card-editor-modal';

describe('CardEditorModal', () => {
  let component: CardEditorModal;
  let fixture: ComponentFixture<CardEditorModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardEditorModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CardEditorModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
