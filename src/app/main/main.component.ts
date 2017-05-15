import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {MdDialog, MdDialogRef} from '@angular/material';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {Logger, MessageBus} from '@tangential/core';
import {AuthenticationService, Visitor, VisitorService} from '@tangential/authorization-service';
import {Subscription} from 'rxjs/Subscription';
import {AppRoutes} from '../app.routing.module';
import {AppEventMessage} from '@tangential/analytics';
import {ContextMenuMessage, Icon, Menu, MenuItem, NotificationMessage, SideNavComponent} from '@tangential/components';
import {Placeholder} from '@tangential/firebase-util';

@Component({
  selector: 'tanj-main',
  templateUrl: 'main.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit, OnDestroy {
  visitor: Visitor
  dialogRef: MdDialogRef<any>

  title = 'Tangential'
  showAds: boolean = false
  adRegion: string


  sideNavOpened: boolean = false
  appRoutes = AppRoutes

  @ViewChild(SideNavComponent) private sideNav: SideNavComponent;

  private visitorWatch: Subscription
  private capturesWatch: Subscription
  private menu: Menu;


  constructor(private router: Router,
              private bus: MessageBus,
              private authService: AuthenticationService,
              private visitorService: VisitorService,
              private changeDetectorRef: ChangeDetectorRef,
              private dialog: MdDialog) {
    bus.all.filter(msg => msg.type === AppEventMessage.OpenAppNavRequest).subscribe({
      next: (v) => {
        Logger.debug(this.bus, this, 'MainComponent opening side-nav')
        this.sideNav.open()
      }
    })
  }

  ngOnDestroy() {
    if (this.visitorWatch) {
      this.visitorWatch.unsubscribe()
    }
    if (this.capturesWatch) {
      this.capturesWatch.unsubscribe()
    }
  }

  ngOnInit() {
    this.visitorWatch = this.visitorService.visitor$().filter(v => v !== Placeholder).subscribe((visitor) => {
      Logger.trace(this.bus, this, '#ngOnInit:visitor$', 'Visitor changed', visitor ? visitor.subject.displayName : 'null')
      this.visitor = visitor
      this.buildMenu([])
      this.sendStandardNotifications()
      if (visitor.subject.isSignedIn()) {
        // Initialize things, redirect, whatever.
      }
      this.changeDetectorRef.markForCheck()
    })

    ContextMenuMessage.filter(this.bus).subscribe({
      next: (v) => {
        this.buildMenu(v.menuItems)
        this.changeDetectorRef.markForCheck()
      }
    })


    this.router.events.subscribe((event: any) => {
      if (event.state) {
        let child: ActivatedRouteSnapshot = event.state.root
        while (child.firstChild) {
          child = child.firstChild
        }
        this.showAds = child.data && child.data['showAds']
        if (this.showAds) {
          this.adRegion = child.url.join('_');
        }
      }
    })
  }

  sendStandardNotifications() {
    if (!this.visitor.prefs.hideCookieWarnings) {
      this.showCookieNotification();
    }
  }

  private showCookieNotification() {

    const notice = NotificationMessage.info({
      message: 'Like nearly all sites, we use Cookies. For more information please see our privacy policy. (click/tap to dismiss)',
      duration: 0
    })
    notice.response(this.bus).subscribe(() => {
      this.visitor.prefs.hideCookieWarnings = true
      this.visitorService.updateVisitorPreferences(this.visitor.$key, this.visitor.prefs)
    })
  }

  helpClicked() {
    if (this.dialogRef) {
      this.dialogRef.close(null)
    } else {
      let currentPage = this.router.routerState.snapshot.root
      while (currentPage.firstChild) {
        currentPage = currentPage.firstChild
      }
      const helpComponent = currentPage.data['help']

      if (helpComponent) {

        this.dialogRef = this.dialog.open(helpComponent, {
          height: '70%',
          width: '100%',
          position: {
            top: '5em',
          }
        });

        this.dialogRef.afterClosed().subscribe((result: any) => {
          this.dialogRef = null
        });
      }
    }

  }

  doSignIn() {
    this.router.navigate(['./sign-in'])
  }


  buildMenu(contextMenuItems:MenuItem[]) {
    this.menu = new Menu()
    this.menu.addItem(new MenuItem('Home', Icon.material('home'), AppRoutes.home.navTargets.absSelf))
    if (this.visitor.subject.isAdministrator()) {
      this.menu.addSeparator()
      this.menu.addItem(new MenuItem('Permissions', Icon.material('security'), ['/admin/permissions']))
      this.menu.addItem(new MenuItem('Roles', Icon.material('security'), ['/admin/roles']))
      this.menu.addItem(new MenuItem('Users', Icon.material('security'), ['/admin/users']))
    }

    if(contextMenuItems && contextMenuItems.length){
      this.menu.addSeparator()
      contextMenuItems.forEach(item => {
        this.menu.addItem(item)
      })


    }

    this.menu.addSeparator()
    if (this.visitor.subject.isSignedIn()) {
      if (this.visitor.subject.isAnonymousAccount()) {
        this.menu.addItem(new MenuItem('Register and save trial account', Icon.material('person_add'), AppRoutes.home.navTargets.absSignUp()))
        this.menu.addItem(new MenuItem('Destroy Account', Icon.fa('trash'), AppRoutes.home.navTargets.absSignOut()))
      } else{
        this.menu.addItem(new MenuItem('Sign out', Icon.fa('fa-sign-out'), ()=> this.onSignOutRequest() ))
      }
    } else {
      this.menu.addItem(new MenuItem('Sign in', Icon.material('verified_user'), AppRoutes.home.navTargets.absSignIn()))
      this.menu.addItem(new MenuItem('Sign up', Icon.material('person_add'), AppRoutes.home.navTargets.absSignUp()))
      this.menu.addItem(new MenuItem('Try it out', Icon.fa('thumbs-o-up'), () => this.onTryoutRequest()))
    }


  }

  onSignOutRequest() {
    this.authService.signOut().then(() => {
      this.router.navigate(AppRoutes.home.navTargets.absSelf)
    })
  }

  onTryoutRequest() {
    this.authService.signInAnonymously().then(() => {
      this.router.navigate(AppRoutes.home.navTargets.absTryoutWelcome())
    })
  }

}



