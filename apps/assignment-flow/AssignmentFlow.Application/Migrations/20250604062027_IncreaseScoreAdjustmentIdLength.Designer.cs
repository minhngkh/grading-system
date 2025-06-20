﻿// <auto-generated />
using System;
using System.Collections.Generic;
using AssignmentFlow.Application.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AssignmentFlow.Application.Migrations
{
    [DbContext(typeof(AssignmentFlowDbContext))]
    [Migration("20250604062027_IncreaseScoreAdjustmentIdLength")]
    partial class IncreaseScoreAdjustmentIdLength
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.5")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("AssignmentFlow.Application.Assessments.Assessment", b =>
                {
                    b.Property<string>("Id")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<int>("AdjustedCount")
                        .HasColumnType("integer");

                    b.Property<string>("GradingId")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<DateTimeOffset>("LastModified")
                        .HasColumnType("timestamp with time zone");

                    b.Property<decimal>("RawScore")
                        .HasColumnType("numeric");

                    b.Property<decimal>("ScaleFactor")
                        .HasColumnType("numeric");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<string>("SubmissionReference")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("TeacherId")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<int>("Version")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.ToTable("Assessments");
                });

            modelBuilder.Entity("AssignmentFlow.Application.Assessments.ScoreAdjustment", b =>
                {
                    b.Property<string>("Id")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("AdjustmentSource")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("AssessmentId")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<DateTimeOffset>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<decimal>("DeltaScore")
                        .HasColumnType("numeric");

                    b.Property<string>("GradingId")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<decimal>("Score")
                        .HasColumnType("numeric");

                    b.Property<string>("TeacherId")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.HasKey("Id");

                    b.ToTable("ScoreAdjustments");
                });

            modelBuilder.Entity("AssignmentFlow.Application.Gradings.Grading", b =>
                {
                    b.Property<string>("Id")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<DateTimeOffset>("LastModified")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("RubricId")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<decimal>("ScaleFactor")
                        .HasColumnType("numeric");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<string>("TeacherId")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<int>("Version")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.ToTable("Gradings");
                });

            modelBuilder.Entity("AssignmentFlow.Application.Assessments.Assessment", b =>
                {
                    b.OwnsMany("AssignmentFlow.Application.Assessments.ScoreBreakdownApiContract", "ScoreBreakdowns", b1 =>
                        {
                            b1.Property<string>("AssessmentId")
                                .HasColumnType("character varying(50)");

                            b1.Property<int>("__synthesizedOrdinal")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("integer");

                            b1.Property<string>("CriterionName")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<string>("PerformanceTag")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<decimal>("RawScore")
                                .HasColumnType("numeric");

                            b1.HasKey("AssessmentId", "__synthesizedOrdinal");

                            b1.ToTable("Assessments");

                            b1.ToJson("ScoreBreakdowns");

                            b1.WithOwner()
                                .HasForeignKey("AssessmentId");
                        });

                    b.OwnsMany("AssignmentFlow.Application.Assessments.FeedbackItemApiContract", "Feedbacks", b1 =>
                        {
                            b1.Property<string>("AssessmentId")
                                .HasColumnType("character varying(50)");

                            b1.Property<int>("__synthesizedOrdinal")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("integer");

                            b1.Property<string>("Comment")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<string>("Criterion")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<string>("FileRef")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<int>("FromCol")
                                .HasColumnType("integer");

                            b1.Property<int>("FromLine")
                                .HasColumnType("integer");

                            b1.Property<string>("Tag")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<int>("ToCol")
                                .HasColumnType("integer");

                            b1.Property<int>("ToLine")
                                .HasColumnType("integer");

                            b1.HasKey("AssessmentId", "__synthesizedOrdinal");

                            b1.ToTable("Assessments");

                            b1.ToJson("Feedbacks");

                            b1.WithOwner()
                                .HasForeignKey("AssessmentId");
                        });

                    b.Navigation("Feedbacks");

                    b.Navigation("ScoreBreakdowns");
                });

            modelBuilder.Entity("AssignmentFlow.Application.Assessments.ScoreAdjustment", b =>
                {
                    b.OwnsMany("AssignmentFlow.Application.Assessments.ScoreBreakdownApiContract", "DeltaScoreBreakdowns", b1 =>
                        {
                            b1.Property<string>("ScoreAdjustmentId")
                                .HasColumnType("character varying(100)");

                            b1.Property<int>("__synthesizedOrdinal")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("integer");

                            b1.Property<string>("CriterionName")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<string>("PerformanceTag")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<decimal>("RawScore")
                                .HasColumnType("numeric");

                            b1.HasKey("ScoreAdjustmentId", "__synthesizedOrdinal");

                            b1.ToTable("ScoreAdjustments");

                            b1.ToJson("DeltaScoreBreakdowns");

                            b1.WithOwner()
                                .HasForeignKey("ScoreAdjustmentId");
                        });

                    b.OwnsMany("AssignmentFlow.Application.Assessments.ScoreBreakdownApiContract", "ScoreBreakdowns", b1 =>
                        {
                            b1.Property<string>("ScoreAdjustmentId")
                                .HasColumnType("character varying(100)");

                            b1.Property<int>("__synthesizedOrdinal")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("integer");

                            b1.Property<string>("CriterionName")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<string>("PerformanceTag")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<decimal>("RawScore")
                                .HasColumnType("numeric");

                            b1.HasKey("ScoreAdjustmentId", "__synthesizedOrdinal");

                            b1.ToTable("ScoreAdjustments");

                            b1.ToJson("ScoreBreakdowns");

                            b1.WithOwner()
                                .HasForeignKey("ScoreAdjustmentId");
                        });

                    b.Navigation("DeltaScoreBreakdowns");

                    b.Navigation("ScoreBreakdowns");
                });

            modelBuilder.Entity("AssignmentFlow.Application.Gradings.Grading", b =>
                {
                    b.OwnsMany("AssignmentFlow.Application.Gradings.SelectorApiContract", "Selectors", b1 =>
                        {
                            b1.Property<string>("GradingId")
                                .HasColumnType("character varying(50)");

                            b1.Property<int>("__synthesizedOrdinal")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("integer");

                            b1.Property<string>("Criterion")
                                .IsRequired()
                                .HasMaxLength(50)
                                .HasColumnType("character varying(50)");

                            b1.Property<string>("Pattern")
                                .IsRequired()
                                .HasMaxLength(150)
                                .HasColumnType("character varying(150)");

                            b1.HasKey("GradingId", "__synthesizedOrdinal");

                            b1.ToTable("Gradings");

                            b1.ToJson("Selectors");

                            b1.WithOwner()
                                .HasForeignKey("GradingId");
                        });

                    b.OwnsMany("AssignmentFlow.Application.Gradings.SubmissionPersistence", "SubmissionPersistences", b1 =>
                        {
                            b1.Property<string>("GradingId")
                                .HasColumnType("character varying(50)");

                            b1.Property<int>("__synthesizedOrdinal")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("integer");

                            b1.PrimitiveCollection<List<string>>("Attachments")
                                .IsRequired()
                                .HasColumnType("text[]");

                            b1.Property<string>("Reference")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.HasKey("GradingId", "__synthesizedOrdinal");

                            b1.ToTable("Gradings");

                            b1.ToJson("SubmissionPersistences");

                            b1.WithOwner()
                                .HasForeignKey("GradingId");
                        });

                    b.Navigation("Selectors");

                    b.Navigation("SubmissionPersistences");
                });
#pragma warning restore 612, 618
        }
    }
}
