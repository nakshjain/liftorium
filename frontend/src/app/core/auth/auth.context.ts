import { HttpContextToken } from '@angular/common/http';

export const BYPASS_AUTH_INTERCEPTOR = new HttpContextToken<boolean>(() => false);
