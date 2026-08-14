import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  document: string; // CPF or CNPJ

  @Column({ nullable: true })
  gatewayClientCode: string;

  @Column({ nullable: true })
  gatewayStoreKey: string;

  @OneToMany(() => CheckoutLink, (link) => link.merchant)
  checkoutLinks: CheckoutLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum CheckoutLinkStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('checkout_links')
export class CheckoutLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', comment: 'Amount in cents (e.g. 5000 = R$ 50.00)' })
  amountCents: number;

  @Column({
    type: 'enum',
    enum: CheckoutLinkStatus,
    default: CheckoutLinkStatus.ACTIVE,
  })
  status: CheckoutLinkStatus;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.checkoutLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: User;

  @Column()
  merchantId: string;

  @OneToMany(() => Order, (order) => order.checkoutLink)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum PaymentMethod {
  PIX = 'PIX',
  CARD = 'CARD',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true })
  externalReference: string; // Correlates to BaaS order ID in Gateway

  @Column({ nullable: true })
  gatewayPaymentId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'int', comment: 'Order amount in cents' })
  amountCents: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  feePercent: number;

  @Column({ type: 'int', default: 1 })
  installments: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  pixQrCodeBase64: string;

  @Column({ type: 'text', nullable: true })
  pixEmv: string;

  @Column({ nullable: true })
  pixTxid: string;

  @Column({ nullable: true })
  cardBrand: string;

  @Column({ nullable: true })
  cardLast4: string;

  @Column({ nullable: true })
  payerName: string;

  @Column({ nullable: true })
  payerEmail: string;

  @Column({ nullable: true })
  payerDocument: string;

  @ManyToOne(() => CheckoutLink, (link) => link.orders, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'checkoutLinkId' })
  checkoutLink: CheckoutLink;

  @Column({ nullable: true })
  checkoutLinkId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  gatewayWithdrawalId: string;

  @Column({ type: 'int', comment: 'Withdrawal amount in cents' })
  amountCents: number;

  @Column()
  pixKeyType: string;

  @Column()
  pixKey: string;

  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  eventType: string; // PAYMENT_PIX, PAYMENT_CARD, WITHDRAWAL

  @Index()
  @Column({ nullable: true })
  externalReference: string;

  @Column({ type: 'json' })
  payload: Record<string, any>;

  @Column({ default: false })
  processed: boolean;

  @Column({ type: 'text', nullable: true })
  processingError: string;

  @CreateDateColumn()
  receivedAt: Date;
}
