import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGateService } from '../../../core/auth/auth-gate.service';
import { GuestDashboardComponent } from './guest-dashboard';

// Helper: find a button by its trimmed text content.
function getButtonByText(
  el: HTMLElement,
  text: string,
): HTMLButtonElement | undefined {
  return Array.from(el.querySelectorAll('button[type="button"]')).find(
    (btn) => btn.textContent?.trim() === text,
  ) as HTMLButtonElement | undefined;
}

describe('GuestDashboardComponent', () => {
  let fixture: ComponentFixture<GuestDashboardComponent>;
  let component: GuestDashboardComponent;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let authGateService: AuthGateService;
  let nativeEl: HTMLElement;

  beforeEach(async () => {
    mockRouter = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [GuestDashboardComponent],
      providers: [
        AuthGateService,
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestDashboardComponent);
    component = fixture.componentInstance;
    nativeEl = fixture.nativeElement as HTMLElement;
    authGateService = TestBed.inject(AuthGateService);
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------------------
  // 1. Start Workout navigates to /app/workout
  // ---------------------------------------------------------------------------
  it('Start Workout button navigates to /app/workout', () => {
    const startBtn = getButtonByText(nativeEl, 'Start Workout');
    expect(startBtn).toBeTruthy();

    startBtn!.click();

    expect(mockRouter.navigate).toHaveBeenCalledOnce();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workout']);
  });

  // ---------------------------------------------------------------------------
  // 2. Locked cards show a lock SVG icon
  // ---------------------------------------------------------------------------
  it('locked cards each show a lock SVG icon', () => {
    const lockedCardTitles = ['Progressive Overload', 'Analytics', 'PR Tracking'];

    for (const title of lockedCardTitles) {
      const btn = getButtonByText(nativeEl, title);
      // Text match on a card button includes child text; find via contains-text
      // The card buttons have nested structure — find the button whose text includes the title
      const cardBtn = Array.from(nativeEl.querySelectorAll('button[type="button"]')).find(
        (b) => b.textContent?.includes(title),
      ) as HTMLButtonElement | undefined;

      expect(cardBtn, `card button for "${title}" should exist`).toBeTruthy();

      const lockSvg = cardBtn!.querySelector('svg');
      expect(lockSvg, `lock SVG should be present on "${title}" card`).toBeTruthy();
    }
  });

  // ---------------------------------------------------------------------------
  // 3. Clicking a locked card sets authGateService.pendingFeature
  // ---------------------------------------------------------------------------
  it('clicking Progressive Overload card sets pendingFeature to "Progressive Overload"', () => {
    const cardBtn = Array.from(nativeEl.querySelectorAll('button[type="button"]')).find(
      (b) => b.textContent?.includes('Progressive Overload'),
    ) as HTMLButtonElement | undefined;

    expect(cardBtn).toBeTruthy();
    cardBtn!.click();

    expect(authGateService.pendingFeature()).toBe('Progressive Overload');
  });

  // ---------------------------------------------------------------------------
  // 4. Clicking a locked card opens the AuthGateModal
  // ---------------------------------------------------------------------------
  it('clicking Analytics card shows app-auth-gate-modal in the DOM', async () => {
    const cardBtn = Array.from(nativeEl.querySelectorAll('button[type="button"]')).find(
      (b) => b.textContent?.includes('Analytics'),
    ) as HTMLButtonElement | undefined;

    expect(cardBtn).toBeTruthy();
    cardBtn!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const modal = nativeEl.querySelector('app-auth-gate-modal');
    expect(modal, 'app-auth-gate-modal element should be present after clicking a locked card').toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // 5. Clicking the unlocked Workout Tracking card navigates to /app/workout
  // ---------------------------------------------------------------------------
  it('clicking Workout Tracking card navigates to /app/workout', () => {
    const cardBtn = Array.from(nativeEl.querySelectorAll('button[type="button"]')).find(
      (b) => b.textContent?.includes('Workout Tracking'),
    ) as HTMLButtonElement | undefined;

    expect(cardBtn).toBeTruthy();
    cardBtn!.click();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workout']);
  });
});
