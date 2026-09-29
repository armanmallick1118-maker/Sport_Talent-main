-- Add fields used by the athlete profile form and live athlete card.
ALTER TABLE "Profile" ADD COLUMN "age" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "height" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "weight" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "experience" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "training_frequency" TEXT;
