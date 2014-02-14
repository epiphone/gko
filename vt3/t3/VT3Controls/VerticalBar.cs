using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Drawing.Drawing2D;

namespace VT3Controls
{
    public partial class VerticalBar : UserControl
    {
        Color color;
        public Color BarColor
        {
            get { return color; }
            set { color = value; VerticalBar_Resize(this, null); }
        }

        Brush brush;
        Blend blend;

        public VerticalBar()
        {
            InitializeComponent();
            blend = new Blend();
            blend.Factors = new float[] { 0, 1, 0 };
            blend.Positions = new float[] { 0, 0.5f, 1 };
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics canvas = e.Graphics;
            canvas.FillRectangle(brush, 0, 0, ClientSize.Width, ClientSize.Height);
        }

        private void VerticalBar_Resize(object sender, EventArgs e)
        {
            if (brush != null) brush.Dispose();

            brush = new System.Drawing.Drawing2D.LinearGradientBrush(new Point(0, 0),
                new Point(ClientSize.Width, 0), BarColor, Color.White) { Blend = blend };

            Invalidate();
        }

        private void Parent_Resize(object sender, EventArgs e)
        {
            if (AutoSize)
            {
                this.Height = Parent.ClientSize.Height;
            }
        }

        private void VerticalBar_ParentChanged(object sender, EventArgs e)
        {
            if (Parent != null)
            {
                Parent.Resize += new EventHandler(Parent_Resize);
                if (AutoSize)
                {
                    this.Height = Parent.ClientSize.Height;
                }
            }
        }
    }
}
