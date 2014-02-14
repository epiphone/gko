using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using VT3Controls;

namespace vt3
{
    public partial class FormVT3 : Form
    {
        List<VerticalBar> bars = new List<VerticalBar>();
        List<int> coords = new List<int>();
        int stepIndex = 0;
        int barCount = 5;
        int barWidth = 50;
        int barMargin = 20;

        int angle = 0;
        Font font;

        public FormVT3()
        {
            InitializeComponent();

            for (int i = 0; i < barCount; i++)
            {
                var bar = new VT3Controls.VerticalBar()
                {
                    BarColor = Color.Red,
                    AutoSize = true,
                    Width = barWidth
                };
                Controls.Add(bar);
                bars.Add(bar);
            }
            FormVT3_Resize(this, null);

            this.components = new System.ComponentModel.Container();
            var timer = new System.Windows.Forms.Timer(components);
            timer.Interval = 20;
            timer.Tick += new System.EventHandler(timer_Tick);
            timer.Enabled = true;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.TranslateTransform(ClientSize.Width / 2, ClientSize.Height / 2);
            g.RotateTransform(angle);

            var rect = new Rectangle(-ClientSize.Width / 4, -ClientSize.Height / 4,
                ClientSize.Width / 2, ClientSize.Height / 2);
            g.DrawRectangle(Pens.White, rect);

            font = new Font("Verdana", ClientSize.Height / 4, GraphicsUnit.Pixel);
            g.DrawString("TIEA212", font, Brushes.White, rect, new StringFormat
            {
                LineAlignment = StringAlignment.Center,
                Alignment = StringAlignment.Center
            });
            font.Dispose();
        }

        private void timer_Tick(object sender, EventArgs e)
        {
            var i = stepIndex++;
            foreach (var bar in bars)
            {
                if (i < 0)
                {
                    i = coords.Count + i;
                }
                bar.Left = coords[i];
                i -= barMargin;
            }
            stepIndex = stepIndex < coords.Count ? stepIndex : 0;

            if (++angle > 360) angle = 0;

            Invalidate();
        }

        private void FormVT3_Resize(object sender, EventArgs e)
        {
            coords.Clear();

            int stepCount = 300;
            var step = 2 * Math.PI / stepCount;

            for (int i = 0; i < stepCount; i++)
            {
                var newStep = Math.Sin(i * step) * ClientSize.Width / 2 + ClientSize.Width / 2;
                coords.Add((int)newStep);
            }

            Invalidate();
        }
    }
}
