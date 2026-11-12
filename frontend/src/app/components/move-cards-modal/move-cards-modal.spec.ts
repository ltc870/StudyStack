import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoveCardsModal } from './move-cards-modal';

describe('MoveCardsModal', () => {
  let component: MoveCardsModal;
  let fixture: ComponentFixture<MoveCardsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveCardsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveCardsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
