/* tslint:disable:no-unused-variable */
import {
  AdminService,
  AuthenticationService,
  AuthSettingsService,
  FirebaseAdminService,
  FirebaseAuthenticationService,
  FirebaseAuthSettingsService,
  FirebaseUserService,
  UserService
} from '@tangential/authorization-service';
import {
  BusLogger,
  ConsoleLogger,
  Logger,
  MessageBus
} from '@tangential/core';

import {FirebaseConfig, FirebaseProvider} from '@tangential/firebase-util';
import {environment} from '../../../../environments/environment.dev';
import {TestConfiguration} from '../test-config.spec';
import {ReflectiveInjector} from '@angular/core';
import {TestEntry} from '@tangential/authorization-service';
import {AuthenticationTestSet} from './authentication-test-set.spec';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000

const TestProviders = [
  AuthenticationTestSet,
  MessageBus,
  {provide: Logger, useClass: ConsoleLogger},
  TestConfiguration,
  FirebaseProvider,
  {provide: FirebaseConfig, useValue: environment.firebase.config},
  {provide: UserService, useClass: FirebaseUserService},
  {provide: AuthSettingsService, useClass: FirebaseAuthSettingsService},
  {provide: AdminService, useClass: FirebaseAdminService},
  {provide: AuthenticationService, useClass: FirebaseAuthenticationService}
]

let bus;
let testSet: AuthenticationTestSet

try {
  const injector = ReflectiveInjector.resolveAndCreate(TestProviders);
  bus = injector.get(MessageBus)
  let logger = injector.get(Logger)
  testSet = injector.get(AuthenticationTestSet)
} catch (e) {
  console.log('error', e)
}
describe(testSet.description, () => {

  beforeEach((done) => testSet.beforeEach().then(done))

  testSet.declareTests().forEach((test: TestEntry) => {
    fit(test[0], test[1])
  })

})
