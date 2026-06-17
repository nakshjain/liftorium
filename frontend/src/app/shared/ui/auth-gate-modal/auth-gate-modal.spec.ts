import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGateModalComponent } from './auth-gate-modal';

// Helper: find a button by its trimmed text content.
function getButtonByText(el: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(el.querySelectorAll('button[type="button"]')).find(
    (btn) => (btn as HTMLButtonElement).textContent?.trim() === text,
  ) as HTMLButtonElement | undefined;
}

describe('AuthGateModalComponent', () => {
  let fixture: ComponentFixture<AuthGateModalComponent>;
  let component: AuthGateModalComponent;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let nativeEl: HTMLElement;

  beforeEach(async () => {
    mockRouter = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [AuthGateModalComponent],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthGateModalComponent);
    component = fixture.componentInstance;
    nativeEl = fixture.nativeElement as HTMLElement;
    // NOTE: detectChanges() is called explicitly per-test so inputs can be set
    // before the first change-detection cycle.
  });

  // -------------------------------------------------------------------------
  // 1. Sign Up navigates to /auth/signup
  // -------------------------------------------------------------------------
  it('Sign Up button navigates to /auth/signup', () => {
    fixture.detectChanges();

    const signUpButton = getButtonByText(nativeEl, 'Sign Up');
    expect(signUpButton).toBeTruthy();
    signUpButton!.click();

    expect(mockRouter.navigate).toHaveBeenCalledOnce();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/signup']);
  });

  // -------------------------------------------------------------------------
  // 2. Login navigates to /auth/login
  // -------------------------------------------------------------------------
  it('Login button navigates to /auth/login', () => {
    fixture.detectChanges();

    const loginButton = getButtonByText(nativeEl, 'Login');
    expect(loginButton).toBeTruthy();
    loginButton!.click();

    expect(mockRouter.navigate).toHaveBeenCalledOnce();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  // -------------------------------------------------------------------------
  // 3. "Continue as Guest" emits dismissed without navigating
  // -------------------------------------------------------------------------
  it('"Continue as Guest" button emits dismissed and does not navigate', () => {
    fixture.detectChanges();

    const dismissedSpy = vi.fn();
    component.dismissed.subscribe(dismissedSpy);

    const continueButton = getButtonByText(nativeEl, 'Continue as Guest');
    expect(continueButton).toBeTruthy();
    continueButton!.click();

    expect(dismissedSpy).toHaveBeenCalledOnce();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 4. Fixed heading "Save your progress" is displayed
  // -------------------------------------------------------------------------
  it('displays the "Save your progress" heading', () => {
    fixture.detectChanges();

    const heading = nativeEl.querySelector('h2') as HTMLHeadingElement;
    expect(heading).toBeTruthy();
    expect(heading.textContent?.trim()).toBe('Save your progress');
  });
});
