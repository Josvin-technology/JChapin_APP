import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { SupabaseService } from '../services/supabase-service';
import { whenAuthReady } from './auth-ready.util';


export const eventValidationGuard: CanActivateFn = async (route) => {
 const auth = inject(AuthService);
 const supabaseClient = inject(SupabaseService).client;
 const router = inject(Router);


 await whenAuthReady(auth);


 if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);


 const eventId = route.paramMap.get('eventId');
 if (!eventId) return router.createUrlTree(['/tickets']);


 const { data, error } = await supabaseClient.rpc('can_validate_event', {
   p_event_id: eventId,
 });


 if (!error && data === true) return true;


 return router.createUrlTree(['/tickets']);
};





