import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EventLocationTrafficComponent } from './event-location-traffic.component';

describe('EventLocationTrafficComponent', () => {
  let component: EventLocationTrafficComponent;
  let fixture: ComponentFixture<EventLocationTrafficComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EventLocationTrafficComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EventLocationTrafficComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
