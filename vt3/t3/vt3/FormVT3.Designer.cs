namespace vt3
{
    partial class FormVT3
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.backgroundWorker1 = new System.ComponentModel.BackgroundWorker();
            this.scroller1 = new VT3Controls.Scroller();
            this.SuspendLayout();
            // 
            // scroller1
            // 
            this.scroller1.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.scroller1.BackColor = System.Drawing.SystemColors.Desktop;
            this.scroller1.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.scroller1.Location = new System.Drawing.Point(0, 281);
            this.scroller1.Name = "scroller1";
            this.scroller1.ScrollerText = "Tähän jotakin tekstiä";
            this.scroller1.Size = new System.Drawing.Size(507, 78);
            this.scroller1.TabIndex = 0;
            // 
            // FormVT3
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(64)))), ((int)(((byte)(64)))));
            this.ClientSize = new System.Drawing.Size(507, 359);
            this.Controls.Add(this.scroller1);
            this.Name = "FormVT3";
            this.Text = "VT3";
            this.Resize += new System.EventHandler(this.FormVT3_Resize);
            this.ResumeLayout(false);

        }

        #endregion

        private System.ComponentModel.BackgroundWorker backgroundWorker1;
        private VT3Controls.Scroller scroller1;
    }
}

