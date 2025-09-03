# Work Plan - @acme/pubsubx (Open Source)

## 📋 Project Overview

Development of an **open source** TypeScript npm library for Google Cloud Pub/Sub that prioritizes **simplicity** and **idempotency**. Framework-agnostic with special support for NestJS.

**🎯 Architecture Philosophy**: **Wrapper approach** - Leverage the official `@google-cloud/pubsub` SDK capabilities rather than reimplementing existing functionality to minimize overhead and maximize reliability.

## 🎯 Main Objectives

### **Phase 1 (v1.0 - Production Ready)**
- ✅ Lightweight client, publisher, consumer **SDK wrappers**
- ✅ **Redis-backed idempotency** store (production-ready)
- ✅ **InMemoryStore** for tests/POC scenarios
- ✅ **Dead Letter Queue** and **max retry** configuration via SDK
- ✅ ESM + CJS build with TypeScript declarations
- ✅ Complete unit testing with Vitest
- ✅ **Open Source**: MIT License, contributing guidelines, security policy

### **Phase 2 (Future - v2.0)**
- ⏳ Schema validation (JSON/Avro/Proto)
- ⏳ Advanced observability (OTel/Prometheus)
- ⏳ Performance optimizations and batching

## 📅 Development Timeline

### **Phase 1: Base Setup (Day 1-2)**
**⏱️ Estimation: 1-2 days**

#### 1.1 Project Setup
- [ ] Initialize npm project with `package.json`
- [ ] Configure TypeScript (`tsconfig.json`)
- [ ] Setup build with `tsup` (`tsup.config.ts`)
- [ ] Configure Vitest (`vitest.config.ts`)
- [ ] Setup ESLint + Prettier
- [ ] Configure GitHub Actions CI (`ci.yml`)
- [ ] **🆕 Open Source Setup:**
  - [ ] Create `LICENSE` (MIT)
  - [ ] Create `CONTRIBUTING.md`
  - [ ] Create `CODE_OF_CONDUCT.md`
  - [ ] Create `SECURITY.md`
  - [ ] Configure GitHub issue templates
  - [ ] Configure PR template
  - [ ] Setup Dependabot for security updates

**Deliverables:**
- Functional project structure
- Operational build and test scripts
- Basic CI configured
- **Complete open source documentation**

#### 1.2 Type Definitions
- [ ] Create `src/types.ts` with all public interfaces
- [ ] Define `PubSubClientOptions`, `PublisherOptions`, `ConsumerOptions`
- [ ] Interfaces for idempotency (`IdempotencyStore`, `RedisOptions`)
- [ ] Types for schemas and logging

**Deliverables:**
- Complete `types.ts` file
- TypeDoc documentation in interfaces

### **Phase 2: Base Client (Day 3)**
**⏱️ Estimation: 1 day**

#### 2.1 PubSub Client
- [ ] Implement `src/client.ts`
- [ ] `createPubSubClient(opts)` function
- [ ] ADC (Application Default Credentials) support
- [ ] Explicit credentials support
- [ ] Handle `projectId` and `endpoint`

**Deliverables:**
- Functional client with authentication
- Unit tests for authentication
- Usage documentation

### **Phase 3: Publisher (Day 4-5)**
**⏱️ Estimation: 1 day** *(Reduced - leveraging SDK)*

#### 3.1 Publisher Wrapper
- [ ] Implement `src/publisher.ts`
- [ ] `createPublisher(client, options)` function
- [ ] **Wrapper around SDK's retry configuration** (not reimplementation)
- [ ] Automatic JSON serialization
- [ ] Handle attributes and `orderingKey`
- [ ] **Pass-through SDK retry options**: `retry: { initialDelayMs, maxDelayMs, factor, maxAttempts }`

#### 3.2 Observability Hooks
- [ ] `onPublishRetry` hook for observability (if SDK exposes events)
- [ ] Simple error context wrapping
- [ ] **Leverage SDK's built-in retry logic** - don't reimplement

**Deliverables:**
- Lightweight publisher wrapper
- SDK retry configuration tests
- Documentation with SDK-native examples

### **Phase 4: Base Consumer (Day 5-6)**
**⏱️ Estimation: 1.5 days**

#### 4.1 Consumer Wrapper
- [ ] Implement `src/consumer.ts`
- [ ] `createConsumer(client, options)` function
- [ ] **Wrapper around SDK's subscription configuration**
- [ ] **Pass-through SDK options**: `flowControl`, `ackDeadline`, `maxExtension`
- [ ] **Dead Letter Queue**: Configure via SDK's `deadLetterPolicy`
- [ ] **Max delivery attempts**: Use SDK's `maxDeliveryAttempts`

#### 4.2 Hooks and Observability
- [ ] Implement hooks: `onError`, `onMessageStart`, `onMessageEnd`
- [ ] Structured error context
- [ ] Optional integrated logging
- [ ] Graceful shutdown with `stop()`
- [ ] **Leverage SDK's built-in flow control and retry mechanisms**

**Deliverables:**
- Lightweight consumer wrapper
- SDK-native DLQ and retry configuration
- Consumer tests with mocks

### **Phase 5: Redis Idempotency System (Day 7-8)**
**⏱️ Estimation: 1.5 days**

#### 5.1 Redis Store (Production-Ready)
- [ ] Implement `src/idempotency/redis-store.ts`
- [ ] Support both `ioredis` and `node-redis` clients
- [ ] Redis connection with automatic retry
- [ ] Key expiration with configurable TTL (default: 6h)
- [ ] **Robust error handling** for Redis failures

#### 5.2 Consumer Integration
- [ ] `idempotencyEnabled` flag
- [ ] Customizable `idempotencyKeySelector`
- [ ] Flow: check → execute → mark as processed
- [ ] Redis connection lifecycle management
- [ ] **Production-grade error handling** for Redis failures

**Deliverables:**
- Production-ready Redis idempotency store
- Support for both Redis clients (ioredis/node-redis)
- Consumer tests with Redis mocks
- Redis setup and configuration documentation

### **Phase 6: Complete Testing (Day 9-10)**
**⏱️ Estimation: 1.5 days**

#### 6.1 Unit Tests
- [ ] Mock `@google-cloud/pubsub` with simple objects (publishMessage, subscription.on)
- [ ] Validate pass-through of SDK options
- [ ] Test orderingKeySelector, attributesDefaults
- [ ] Idempotency flow: has → set → ack/nack

#### 6.2 Redis Testing
- [ ] Use `ioredis-mock` for happy path testing
- [ ] Test adapter compatibility with `node-redis`
- [ ] TTL tests with Vitest fake timers
- [ ] Connection failure and recovery scenarios

#### 6.3 E2E Testing (Optional)
- [ ] Pub/Sub emulator for smoke test publisher→consumer
- [ ] Integration test with real Redis instance

**Deliverables:**
- Comprehensive test suite (>90% coverage)
- Redis mocking with TTL validation
- E2E smoke tests with emulator

### **Phase 7: Documentation & Examples (Day 11-12)**
**⏱️ Estimation: 1.5 days**

#### 7.1 Complete Documentation

### **Phase 7: Documentation and Examples (Day 11)**
**⏱️ Estimation: 1 day**

#### 7.1 Main README (Open Source)
- [ ] **Open Source Badge Section** (license, build status, coverage)
- [ ] **Installation** with npm/yarn/pnpm
- [ ] **Quick Start** in 3 minutes
- [ ] **API Documentation** with examples
- [ ] **Configuration Guide** focusing on **SDK option pass-through**
- [ ] **Authentication Guide** (ADC, Service Accounts)
- [ ] **Dead Letter Queue** setup examples
- [ ] **Redis Idempotency** configuration and usage
- [ ] **Roadmap** mentioning schemas and observability in v2.0

#### 7.2 Examples and Demos
- [ ] Create `examples/` directory
- [ ] `examples/basic/` - Basic Publisher/Consumer
- [ ] `examples/nestjs/` - Complete NestJS integration
- [ ] `examples/dlq/` - Dead Letter Queue configuration
- [ ] `examples/redis-idempotency/` - Redis idempotency usage
- [ ] `examples/gke/` - GKE deployment with Workload Identity
- [ ] Each example with its own README

#### 7.3 Contribution Documentation
- [ ] Detailed `CONTRIBUTING.md`
- [ ] Development setup instructions
- [ ] **Phase 2 contribution guidelines** (Redis, Schemas)
- [ ] Testing guidelines
- [ ] Code style guidelines

**Deliverables:**
- MVP-focused documentation
- Clear roadmap for v2.0 features
- Working examples for all core features

**Deliverables:**
- Complete documentation with examples
- Generated API documentation
- Functional integration examples

### **Phase 8: Release and Community (Day 13)**
**⏱️ Estimation: 1 day**

#### 8.1 Release Preparation (v1.0 Production)
- [ ] Configure semantic versioning
- [ ] Setup automated release pipeline
- [ ] Configure npm publish automation
- [ ] Setup GitHub Releases with automatic changelog
- [ ] Configure package provenance for npm

#### 8.2 Community Setup
- [ ] Create GitHub Discussions
- [ ] Configure GitHub issue templates:
  - [ ] Bug report template
  - [ ] Feature request template (with v2.0 label)
  - [ ] Question template
- [ ] PR template with checklist
- [ ] `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CONTRIBUTING.md`

#### 8.3 v1.0 Launch
- [ ] Write launch blog post emphasizing **wrapper approach**
- [ ] Create demo video/GIF for README
- [ ] **Highlight**: Lightweight, SDK-native, production-ready
- [ ] **Roadmap**: Clear path to v2.0 with Redis and Schemas

#### 8.4 v2.0 Planning
- [ ] Create **Phase 2** project board
- [ ] Redis store implementation planning
- [ ] Schema validation system design
- [ ] Community feedback collection

**Deliverables:**
- **v1.0 MVP** ready for production use
- Clear roadmap for **v2.0** features
- Community infrastructure
- **Lightweight wrapper** approach validated

## 🔄 **Phase 2 Planning (v2.0 - Future)**

### **Features for v2.0**
- [ ] **Redis Idempotency Store**
  - Support for `ioredis` and `node-redis`
  - Distributed idempotency across instances
  - Advanced TTL and cleanup strategies
- [ ] **Schema Validation System**
  - JSON Schema support
  - Avro schema support
  - Protocol Buffers support
  - Local validation with detailed errors
- [ ] **Advanced Observability**
  - Metrics integration (Prometheus/OpenTelemetry)
  - Distributed tracing
  - Advanced logging and monitoring
- [ ] **Performance Optimizations**
  - Connection pooling optimizations
  - Batch processing enhancements
  - Memory usage optimizations

## 🛠️ Technology Stack

### **Runtime Dependencies (v1.0)**
- `@google-cloud/pubsub` - Official GCP client
- `ioredis` - Redis client for robust idempotency
- **Production-ready** Redis-backed idempotency from v1.0

### **Development Dependencies**
- `typescript` - Primary language
- `tsup` - Build tool (ESM + CJS)
- `vitest` - Testing framework
- `eslint` + `prettier` - Linting and formatting
- `typedoc` - Documentation generation

### **Peer Dependencies (Optional)**
- `redis` - Alternative Redis client (support both ioredis and node-redis)

### **Future Dependencies (v2.0)**
- JSON/Avro/Proto schema validation libraries
- OTel/Prometheus for observability
- GitHub Actions for lint + test + build
- Multi-Node.js version support
- Coverage reporting with Codecov
- **Automated security scanning** (CodeQL, Dependabot)
- **Automated dependency updates**
- **Release automation** with semantic-release
- **npm publish** automation with provenance

## 📦 Final Project Structure (Production-Ready v1.0)

```
pubsubx/
├── src/
│   ├── client.ts                 # createPubSubClient
│   ├── publisher.ts              # createPublisher (SDK wrapper)
│   ├── consumer.ts               # createConsumer (SDK wrapper)
│   ├── idempotency/
│   │   ├── redis-store.ts        # RedisIdempotencyStore (production)
│   │   └── memory-store.ts       # InMemoryStore (tests/POC only)
│   ├── types.ts                  # Public interfaces
│   └── index.ts                  # Main exports
├── __tests__/
│   ├── publisher.spec.ts
│   ├── consumer.spec.ts
│   ├── consumer.idempotency.spec.ts
│   ├── redis-store.spec.ts
│   ├── memory-store.spec.ts
│   └── integration.spec.ts
├── examples/
│   ├── basic/                    # Basic example
│   ├── nestjs/                   # NestJS example
│   ├── dlq/                      # Dead Letter Queue example
│   ├── redis-idempotency/        # Redis idempotency example
│   └── gke/                      # GKE deployment example
├── docs/                         # Documentation
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── release.yml
│   │   └── security.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── v2_feature_request.md
│   └── copilot-instructions.md
├── LICENSE                       # MIT License
├── CONTRIBUTING.md               # Contribution guidelines
├── CODE_OF_CONDUCT.md           # Code of conduct
├── SECURITY.md                  # Security policy
├── ROADMAP.md                   # v2.0 roadmap (schemas + observability)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── README.md                    # Production-focused README
└── WORK_PLAN.md

# Phase 2 additions (v2.0):
# ├── src/schemas/                # JSON/Avro/Proto validation  
# ├── src/observability/          # OTel/Prometheus metrics
# └── __tests__/schemas.spec.ts
```

## 🔍 Acceptance Criteria (Open Source)

### **Functional**
- ✅ Compiles ESM + CJS without errors
- ✅ Generates TypeScript declarations (.d.ts)
- ✅ Passes all unit tests (>90% coverage)
- ✅ Publisher handles pass-through to SDK retry mechanisms
- ✅ Consumer processes messages with Redis-backed idempotency
- ✅ Redis store handles TTL and automatic cleanup
- ✅ DLQ + maxDeliveryAttempts via SDK configuration
- ✅ NestJS integration operational

### **Open Source Standards**
- ✅ MIT License properly configured
- ✅ Contributing guidelines comprehensive
- ✅ Code of Conduct (Contributor Covenant)
- ✅ Security policy with vulnerability reporting
- ✅ Issue and PR templates functional
- ✅ README badges and documentation complete
- ✅ Semantic versioning implemented
- ✅ Automated releases working

### **Community Readiness**
- ✅ Examples work out-of-the-box
- ✅ Documentation covers all use cases
- ✅ CI/CD pipeline passes all checks
- ✅ Security scanning enabled
- ✅ Dependency management automated
- ✅ Package provenance configured

### **Non-Functional**
- ✅ Compatible with Node 18+ LTS
- ✅ No hard dependencies on specific frameworks
- ✅ Complete documentation with examples
- ✅ Mocked tests (no real GCP required)
- ✅ Performance: <100ms overhead per message
- ✅ Memory leaks: Automatic Redis cleanup

## 🚧 Risks and Mitigations

### **Risk: GCP Mocking Complexity**
- **Mitigation**: Use official `@google-cloud/pubsub` patterns
- **Plan B**: Create reusable mock helpers

### **Risk: Redis Client Compatibility**
- **Mitigation**: Abstract `IdempotencyStore` interface
- **Plan B**: Implement adapters for both clients

### **Risk: Schema Validation Performance**
- **Mitigation**: Make validation optional and configurable
- **Plan B**: Lazy loading of validators

### **Risk: Breaking Changes in @google-cloud/pubsub**
- **Mitigation**: Pin specific version + compatibility tests
- **Plan B**: Additional wrapper to isolate changes

### **Risk: Community Adoption**
- **Mitigation**: Comprehensive documentation and examples
- **Plan B**: Active promotion in relevant communities

## 📊 Success Metrics (Open Source)

### **Code Quality**
- **Test Coverage**: >90%
- **Bundle Size**: <500KB (ESM + CJS)
- **Build Time**: <30 seconds
- **Test Suite**: <10 seconds
- **Memory Usage**: <50MB in tests
- **Documentation**: 100% interfaces documented

### **Community Metrics**
- **GitHub Stars**: Target 100+ in first month
- **npm Downloads**: Target 1000+ weekly
- **Issues Response Time**: <24 hours
- **PR Review Time**: <48 hours
- **Community Health Score**: 80%+
- **Security Vulnerabilities**: 0 high/critical

## 🔄 Development Process

### **Daily Workflow**
1. **Morning**: Review plan, update issues
2. **Development**: TDD - Test first, implement, refactor
3. **Evening**: Commit progress, update documentation

### **Code Quality**
- Frequent commits with descriptive messages
- Pre-commit hooks (lint + format)
- PR self-review before merge
- Updated inline documentation

### **Testing Strategy**
- Unit tests for all business logic
- Integration tests for complete flows
- Mock all external dependencies
- Performance tests for critical scenarios

### **Community Engagement**
- Responsive issue triage
- Helpful PR reviews
- Regular community updates
- Transparent roadmap communication

---

## 🚀 Development Commands (Open Source)

```bash
# Initial setup
npm install

# Development
npm run dev          # Watch mode with tsup
npm run test:watch   # Tests in watch mode

# Quality Assurance
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Run all tests
npm run test:coverage # Coverage report
npm run security     # Security audit

# Build & Release
npm run build        # Production build
npm run docs         # Generate TypeDoc
npm run verify       # Full verification pipeline
npm run release      # Automated release (maintainers only)

# Community
npm run contributors # Update contributors list
npm run changelog    # Generate changelog
```

## 🌟 Open Source Best Practices Included

### **📋 Documentation**
- Comprehensive README with badges
- Detailed contributing guidelines
- Code of Conduct (Contributor Covenant)
- Security policy with vulnerability reporting
- Issue and PR templates
- Automated changelog

### **🔒 Security**
- Automatic CodeQL analysis
- Dependabot for security updates
- npm package provenance
- Security.md with reporting process
- Automated vulnerability scanning

### **🤝 Community**
- GitHub Discussions enabled
- Automated issue triage
- PR review checklist
- Contributor recognition
- Community health metrics

### **🚀 Release Management**
- Semantic versioning
- Automated releases with semantic-release
- npm publish automation
- GitHub Releases with changelog
- Multi-node version testing

### **📈 Analytics & Monitoring**
- npm download tracking
- GitHub insights monitoring
- Community health dashboard
- Issue response time tracking
- Security vulnerability monitoring

**Start date**: September 2, 2025  
**Estimated delivery date**: September 16, 2025  
**Total duration**: 14 working days
