/**
 * Bull processor: payment jobs (e.g. retry failed, sync status).
 * Register in WorkerModule with BullModule.registerQueue({ name: 'payment' }).
 */
// import { Processor, Process } from '@nestjs/bull';
// import { Job } from 'bull';

// @Processor('payment')
// export class PaymentProcessor {
//   @Process()
//   async handle(job: Job) {
//     // TODO: process payment job
//   }
// }
