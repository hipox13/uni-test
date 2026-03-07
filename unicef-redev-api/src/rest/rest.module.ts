import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DonationsModule } from './modules/donations/donations.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MediaModule } from './modules/media/media.module';
import { ContentModule } from './modules/content/content.module';
import { PagesModule } from './modules/pages/pages.module';
import { MenusModule } from './modules/menus/menus.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RolesModule } from './modules/roles/roles.module';
import { LogosModule } from './modules/logos/logos.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TagsModule } from './modules/tags/tags.module';
import { LogActivityModule } from './modules/log-activity/log-activity.module';
import { DonorModule } from './modules/donor/donor.module';
import { ContentBlocksModule } from './modules/content-blocks/content-blocks.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DonationsModule,
    TransactionsModule,
    PaymentsModule,
    MediaModule,
    ContentModule,
    PagesModule,
    MenusModule,
    ReportsModule,
    RolesModule,
    LogosModule,
    SettingsModule,
    TagsModule,
    LogActivityModule,
    DonorModule,
    ContentBlocksModule,
  ],
})
export class RestModule {}
